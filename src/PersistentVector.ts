import { PersistentVectorIterator } from './PersistentVectorIterator'

function clone<T>( xs: T[] ): T[] {
	const ret = new Array( xs.length )
	let i = xs.length
	while ( i-- ) {
		ret[i] = xs[i]
	}
	return ret
}

const BITS = 5
const BRANCHING = 1 << BITS
const MASK = BRANCHING - 1

export type PersistentVectorNode<T> = any[] | undefined

export class PersistentVector<T> {
	protected _length = 0
	protected shift = 0
	protected root: PersistentVectorNode<T> = undefined
	protected tail: T[] = []
	
	constructor( array?: T[] ) {
		if ( array ) {
			for ( const v of array ) {
				this.__transientPush( v )
			}
		}
	}

	static of<T>( ...args: T[] ) {
		return new PersistentVector<T>( args )
	}

	static isPersistentVector( vec: any ) {
		return vec instanceof PersistentVector
	}

	static filled<T>( val: T, length: number ) {
		const vec = new PersistentVector<T>()
		for ( let i = 0; i < length; i++ ) {
			vec.__transientPush( val )
		}
		return vec
	}

	static range( start: number, finish?: number, step?: number ): PersistentVector<number> {
		if ( finish === undefined ) {
			finish = start
			start = 0
		}
		if ( step === undefined ) {
			step = start > finish ? -1 : 1
		}
		const vec = new PersistentVector<number>()
		if (( start < finish && step > 0 ) || ( start > finish && step < 0 )) {
			if ( start > finish ) {
				for ( let i = start; i > finish; i += step ) {
					vec.__transientPush( i )
				}
			} else {
				for ( let i = start; i < finish; i += step ) {
					vec.__transientPush( i )
				}
			}
		}
		return vec
	}

	protected static make<T>( length?: number, shift?: number, root?: PersistentVectorNode<T>, tail?: T[] ): PersistentVector<T> {
		const v = new PersistentVector<T>()
		if ( length !== undefined ) v._length = length
		if ( shift !== undefined ) v.shift = shift
		if ( root !== undefined ) v.root = root
		if ( tail !== undefined ) v.tail = tail
		return v
	}

	clone(): PersistentVector<T> {
		return PersistentVector.make<T>( this._length, this.shift, this.root, this.tail )
	}

	clear(): PersistentVector<T> {
		return this._length > 0 ? new PersistentVector<T>() : this
	}

	last(): T | undefined {
		return this.get( this._length - 1 )
	}

	first(): T | undefined {
		return this.get( 0 )
	}

	isEmpty(): boolean {
		return this._length === 0
	}

	get length() {
		return this._length
	}

	get( i: number ): T | undefined {
		if ( i < 0 || i >= this._length ) {
			return undefined
		} else if ( i >= this.tailOffset() ) {
			return this.tail[i & MASK]
		} else {
			let node: any = this.root
			for ( let level = this.shift; level > 0; level -= BITS) {
				node = node[(i >>> level) & MASK]
			}
			return node[i & MASK]
		}
	}


	push( ...values: T[] ): PersistentVector<T> {
		let vec: PersistentVector<T> = this
		for ( const val of values ) {
			const ts = vec._length === 0 ? 0 : ((vec._length - 1) & MASK) + 1
			if ( ts !== BRANCHING ) {
				const newTail = clone( vec.tail )
				newTail.push( val )
				vec = PersistentVector.make<T>( vec._length + 1, vec.shift, vec.root, newTail )
			} else { // have to insert tail into root.
				const newTail = [val]
				// Special case: If old size == BRANCHING, then tail is new root
				if ( vec._length === BRANCHING ) {
					vec = PersistentVector.make<T>( vec._length + 1, 0, vec.tail, newTail )
				}
				// check if the root is completely filled. Must also increment
				// shift if that's the case.
				let newRoot
				let newShift = vec.shift
				if (( vec._length >>> BITS ) > ( 1 << vec.shift )) {
					newShift += BITS
					newRoot = new Array( BRANCHING )
					newRoot[0] = vec.root
					newRoot[1] = vec.newPath( vec.shift, vec.tail )
					vec = PersistentVector.make<T>( vec._length + 1, newShift, newRoot, newTail )
				} else { // still space in root
					newRoot = vec.pushLeaf( vec.shift, vec._length - 1, vec.root, vec.tail )
					vec = PersistentVector.make<T>( vec._length + 1, vec.shift, newRoot, newTail )
				}
			}
		}
		return vec
	}

	set( i: number, val: T ): PersistentVector<T> | undefined {
		if ( i < 0 || i >= this._length || this.root === undefined ) {
			return undefined
		} else if (i >= this.tailOffset()) {
			const newTail = clone( this.tail )
			newTail[i & MASK] = val
			return PersistentVector.make<T>( this._length, this.shift, this.root, newTail )
		} else {
			const newRoot = clone( this.root )
			let node = newRoot
			for ( let level = this.shift; level > 0; level -= BITS ) {
				const subidx = (i >>> level) & MASK
				let child = node[subidx]
				child = clone( child )
				node[subidx] = child
				node = child
			}
			node[i & 31] = val
			return PersistentVector.make<T>( this._length, this.shift, newRoot, this.tail )
		}
	}

	pop(): PersistentVector<T> | undefined {
		if ( this._length === 0 || this.root === undefined ) {
			return undefined
		} else if ( this._length === 1 ) {
			return new PersistentVector<T>()
		} else if ((( this._length - 1 ) & 31 ) > 0 ) {
			// This one is curious: having int ts_1 = ((size-1) & 31) and using
			// it is slower than using tail._length - 1 and newTail._length!
			const newTail = clone( this.tail )
			newTail.pop()
			return PersistentVector.make<T>(this._length - 1, this.shift, this.root, newTail)
		}
		const newTrieSize = this._length - BRANCHING - 1
		// special case: if new size is 32, then new root turns is undefined, old
		// root the tail
		if ( newTrieSize === 0 ) {
			return PersistentVector.make<T>(BRANCHING, 0, undefined, this.root)
		}
		// check if we can reduce the trie's height
		if ( newTrieSize === 1 << this.shift ) { // can lower the height
			const lowerShift = this.shift - BITS
			const newRoot = this.root[0]

			// find new tail
			let node = this.root[1]
			for ( let level = lowerShift; level > 0; level -= BITS) {
				node = node[0]
			}
			return PersistentVector.make<T>(this._length - 1, lowerShift, newRoot, node)
		}

		// diverges contain information on when the path diverges.
		const diverges = newTrieSize ^ (newTrieSize - 1)
		let hasDiverged = false
		const newRoot = clone( this.root )
		let node = newRoot
		for ( let level = this.shift; level > 0; level -= BITS) {
			const subidx = (newTrieSize >>> level) & MASK
			let child = node[subidx]
			if (hasDiverged) {
				node = child
			} else if (( diverges >>> level ) !== 0 ) {
				hasDiverged = true
				node[subidx] = undefined
				node = child
			} else {
				child = clone( child )
				node[subidx] = child
				node = child
			}
		}
		return PersistentVector.make<T>( this._length - 1, this.shift, newRoot, node )
	}



	protected tailOffset(): number {
		return (this._length - 1) & (~MASK)
	}

	protected newPath( levels: number, tail: T[] ): T[] {
		let topNode = tail
		for ( let level = levels; level > 0; level -= BITS ) {
			const newTop = new Array( BRANCHING )
			newTop[0] = topNode
			topNode = newTop
		}
		return topNode
	}

	protected pushLeaf( shift: number, i: number, root: PersistentVectorNode<T>, tail: T[] ): T[] {
		if ( root !== undefined ) {
			const newRoot = clone( root )
			let node = newRoot
			for ( let level = shift; level > BITS; level -= BITS) {
				const subidx = (i >>> level) & MASK
				let child = node[subidx]
				if ( child === undefined ) {
					node[subidx] = this.newPath( level - BITS, tail )
					return newRoot
				}
				child = clone( child )
				node[subidx] = child
				node = child
			}
			node[(i >>> BITS) & MASK] = tail
			return newRoot
		} else {
			return []
		}
	}

	newNode( id: any ) {
		const node = new Array<any>( 33 )
		node[32] = id
		return node
	}
  
	tailSize() {
		return (this._length === 0) ? 0 : ((this._length-1) & 31) + 1
	}

	protected __transientPushLeaf( shift: number, i: number, root: PersistentVectorNode<T>, tail: T[] ): T[] {
		if ( root !== undefined ) {
			let node = root
			for ( let level = shift; level > BITS; level -= BITS ) {
				const subidx = (i >>> level) & MASK
				let child = node[subidx]
				if ( child === undefined ) {
					node[subidx] = this.newPath( level - BITS, tail )
					return root
				}
				node[subidx] = child
				node = child
			}
			node[(i >>> BITS) & MASK] = tail
			return root
		} else {
			return []
		}
	}

	__transientPush( val: T ): PersistentVector<T> {
		const ts = this._length === 0 ? 0 : ((this._length - 1) & MASK) + 1
		if ( ts !== BRANCHING ) {
			this.tail.push( val )
		} else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == BRANCHING, then tail is new root
			if ( this._length === BRANCHING ) {
				this.root = this.tail
				this.tail = newTail
			} else {
				// check if the root is completely filled. Must also increment
				// shift if that's the case.
				if (( this._length >>> BITS ) > ( 1 << this.shift )) {
					const newRoot = new Array( BRANCHING )
					newRoot[0] = this.root
					newRoot[1] = this.newPath( this.shift, this.tail )
					this.shift += BITS
					this.root = newRoot
					this.tail = newTail
				} else { // still space in root
					this.root = this.__transientPushLeaf( this.shift, this._length - 1, this.root, this.tail )
					this.tail = newTail
				}
			}
		}
		this._length++
		return this
	}
	/*
	[Symbol.iterator]() {
		return PersistentVector.makeIterator<T>( this._length, this.shift, this.root, this.tail )
	}
	 */
	forEach<Z>( callbackfn: (this: Z, value: T, index: number, vec: PersistentVector<T>) => void, thisArg?: Z ): void {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )
		}
	}

	reduce( callbackfn: ( previousValue: T, currentValue: T, currentIndex: number, vec: PersistentVector<T> ) => T, initialValue?: T ): T
	reduce<U>( callbackfn: ( previousValue: U, currentValue: T, currentIndex: number, vec: PersistentVector<T> ) => U, initialValue: U ): U {
		const iter = this.iterator()
		let acc = initialValue
		while ( iter.hasNext()) {
			acc = callbackfn.call( acc, iter.getNext(), iter.index-1, this )
		}
		return acc
	}
	
	reduceRight( callbackfn: ( previousValue: T, currentValue: T, currentIndex: number, vec: PersistentVector<T> ) => T, initialValue?: T ): T
	reduceRight<U>( callbackfn: ( previousValue: U, currentValue: T, currentIndex: number, vec: PersistentVector<T> ) => U, initialValue: U ): U {
		let acc = initialValue
		for ( let i = this._length-1; i >= 0; i-- ) {
			acc = callbackfn.call( acc, this.get( i ), i, this )
		}
		return acc
	}

	filter<Z>( callbackfn: ( this: Z, value: T, index: number, vec: PersistentVector<T> ) => any, thisArg?: Z ): PersistentVector<T> {	
		const iter = this.iterator()
		const newVec = new PersistentVector<T>()
		while ( iter.hasNext()) {
			const v = iter.getNext()
			if ( callbackfn.call( thisArg, v, iter.index - 1, this )) {
				newVec.__transientPush( v )
			}
		}
		return newVec
	}

	slice( start: number = 0, end: number = this.length ): PersistentVector<T> {
		start = start < 0 ? this.length + start : start
		end = Math.min( this.length, end < 0 ? this.length + end : end )
		const newVec = new PersistentVector<T>()
		if ( start < end && end <= this.length ) {
			for ( let i = start; i < end; i++ ) {
				newVec.__transientPush( (<T>this.get( i )))
			}
		}
		return newVec
	}

	map<Z,U>( callbackfn: ( this: Z, value: T, index: number, vec: PersistentVector<T> ) => U, thisArg?: Z ): PersistentVector<T> {
		const iter = this.iterator()
		const newVec = new PersistentVector<T>()
		while ( iter.hasNext()) {
			newVec.__transientPush( callbackfn.call( thisArg, iter.getNext(), iter.index-1, this ))
		}
		return newVec
	}

	indexOf( v: T ): number {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( iter.getNext() === v ) {
				return iter.index-1
			}
		}
		return -1
	}

	lastIndexOf( v: T ): number {
		for ( let i = this._length-1; i >= 0; i-- ) {
			if ( this.get( i ) === v ) {
				return i
			}
		}
		return -1
	}

	toArray(): T[] {
		const iter = this.iterator()
		const array: T[] = []
		while ( iter.hasNext()) {
			array.push( iter.getNext())
		}
		return array
	}
	
	every<Z>( callbackfn: ( this: Z, value: T, index: number, vec: PersistentVector<T> ) => boolean, thisArg?: Z ): boolean {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( !callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )) {
				return false
			}
		}
		return true
	}

	some<Z>( callbackfn: ( this: Z, value: T, index: number, vec: PersistentVector<T> ) => boolean, thisArg?: Z ): boolean {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )) {
				return true
			}
		}
		return false
	}

	concat( ...vectors: PersistentVector<T>[] ): PersistentVector<T> {
		let vec: PersistentVector<T> = this
		for ( const v of vectors ) {
			const iter = v.iterator()
			while ( iter.hasNext()) {
				vec = vec.push( iter.getNext())
			}
		}
		return vec
	}

	join( separator: string = ',' ): string {
		const iter = this.iterator() 
		const strAcc: string[] = []
		while ( iter.hasNext()) {
			strAcc.push( iter.getNext().toString() )
		}
		return strAcc.join( separator )
	}

	toString() {
		return this.join()
	}

	reverse(): PersistentVector<T> {
		let vec = new PersistentVector<T>()
		for ( let i = this._length-1; i >= 0; i-- ) {
			vec.push(( <T>this.get( i )))
		}
		return vec
	}

	// TODO
	// custom sort, maybe mergesort?
	sort( compareFn?: (a: T, b: T) => number ): PersistentVector<T> {
		return new PersistentVector<T>( this.toArray().sort( compareFn ))
	}

	iterator(): PersistentVectorIterator<T> {
		return new PersistentVectorIterator<T>( this._length, this.shift, this.root, this.tail )
	}

	// TODO
	// splice and delete
}
