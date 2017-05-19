// TODO
// implement splice
// maybe custom sort (mergesort?)

import { VectorIterator } from './VectorIterator'
import { VectorNode } from './VectorNode'
import { TransientVector } from './TransientVector'
import { BITS, BRANCHING, MASK } from './VectorConst'
import { cloneArray } from './cloneArray'

export class Vector<T> {
	protected _length = 0
	protected shift = 0
	protected root: VectorNode<T> = undefined
	protected tail: T[] = []
	
	constructor( array?: T[] ) {
		if ( array ) {
			const tVec = new TransientVector<T>()
			for ( const v of array ) {
				tVec.push( v )
			}
			this.root = tVec.root
			this.shift = tVec.shift
			this.tail = tVec.tail
			this._length = tVec.length
		}
	}

	static of<T>( ...args: T[] ) {
		return new Vector<T>( args )
	}

	static is( vec: any ) {
		return vec instanceof Vector
	}

	static ofValue<T>( val: T, length: number ) {
		const tVec = new TransientVector<T>()
		for ( let i = 0; i < length; i++ ) {
			tVec.push( val )
		}
		return Vector.ofTransient( tVec )
	}

	static ofTransient<T>( tVec: TransientVector<T> ): Vector<T> {
		const vec = new Vector<T>()
		vec._length = tVec.length
		vec.shift = tVec.shift
		vec.root = tVec.root
		vec.tail = tVec.tail
		tVec.root = undefined
		tVec.shift = 0
		tVec.tail = []
		tVec.length = 0
		return vec
	}

	static range( start: number, finish?: number, step?: number ): Vector<number> {
		if ( finish === undefined ) {
			finish = start
			start = 0
		}
		if ( step === undefined ) {
			step = start > finish ? -1 : 1
		}
		const tVec = new TransientVector<number>()
		if (( start < finish && step > 0 ) || ( start > finish && step < 0 )) {
			if ( start > finish ) {
				for ( let i = start; i > finish; i += step ) {
					tVec.push( i )
				}
			} else {
				for ( let i = start; i < finish; i += step ) {
					tVec.push( i )
				}

			}
		}
		return Vector.ofTransient( tVec )
	}

	protected static make<T>( length?: number, shift?: number, root?: VectorNode<T>, tail?: T[] ): Vector<T> {
		const v = new Vector<T>()
		if ( length !== undefined ) v._length = length
		if ( shift !== undefined ) v.shift = shift
		if ( root !== undefined ) v.root = root
		if ( tail !== undefined ) v.tail = tail
		return v
	}

	cloneArray(): Vector<T> {
		return Vector.make<T>( this._length, this.shift, this.root, this.tail )
	}

	clear(): Vector<T> {
		return this._length > 0 ? new Vector<T>() : this
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

	push( ...values: T[] ): Vector<T> {
		let vec: Vector<T> = this
		for ( const val of values ) {
			const ts = vec._length === 0 ? 0 : ((vec._length - 1) & MASK) + 1
			if ( ts !== BRANCHING ) {
				const newTail = cloneArray( vec.tail )
				newTail.push( val )
				vec = Vector.make<T>( vec._length + 1, vec.shift, vec.root, newTail )
			} else { // have to insert tail into root.
				const newTail = [val]
				// Special case: If old size == BRANCHING, then tail is new root
				if ( vec._length === BRANCHING ) {
					vec = Vector.make<T>( vec._length + 1, 0, vec.tail, newTail )
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
					vec = Vector.make<T>( vec._length + 1, newShift, newRoot, newTail )
				} else { // still space in root
					newRoot = vec.pushLeaf( vec.shift, vec._length - 1, vec.root, vec.tail )
					vec = Vector.make<T>( vec._length + 1, vec.shift, newRoot, newTail )
				}
			}
		}
		return vec
	}

	set( i: number, val: T ): Vector<T> | undefined {
		if ( i < 0 || i >= this._length || this.root === undefined ) {
			return undefined
		} else if (i >= this.tailOffset()) {
			const newTail = cloneArray( this.tail )
			newTail[i & MASK] = val
			return Vector.make<T>( this._length, this.shift, this.root, newTail )
		} else {
			const newRoot = cloneArray( this.root )
			let node = newRoot
			for ( let level = this.shift; level > 0; level -= BITS ) {
				const subidx = (i >>> level) & MASK
				let child = node[subidx]
				child = cloneArray( child )
				node[subidx] = child
				node = child
			}
			node[i & 31] = val
			return Vector.make<T>( this._length, this.shift, newRoot, this.tail )
		}
	}

	update( i: number, callbackFn: (v: T, i: number, vec: Vector<T>) => T ): Vector<T> | undefined {
		var v = this.get( i )
		return v === undefined ? this : this.set( i, callbackFn( v, i, this ))
	}

	pop(): Vector<T> | undefined {
		if ( this._length === 0 || this.root === undefined ) {
			return undefined
		} else if ( this._length === 1 ) {
			return new Vector<T>()
		} else if ((( this._length - 1 ) & 31 ) > 0 ) {
			// This one is curious: having int ts_1 = ((size-1) & 31) and using
			// it is slower than using tail._length - 1 and newTail._length!
			const newTail = cloneArray( this.tail )
			newTail.pop()
			return Vector.make<T>(this._length - 1, this.shift, this.root, newTail)
		}
		const newTrieSize = this._length - BRANCHING - 1
		// special case: if new size is 32, then new root turns is undefined, old
		// root the tail
		if ( newTrieSize === 0 ) {
			return Vector.make<T>(BRANCHING, 0, undefined, this.root)
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
			return Vector.make<T>(this._length - 1, lowerShift, newRoot, node)
		}

		// diverges contain information on when the path diverges.
		const diverges = newTrieSize ^ (newTrieSize - 1)
		let hasDiverged = false
		const newRoot = cloneArray( this.root )
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
				child = cloneArray( child )
				node[subidx] = child
				node = child
			}
		}
		return Vector.make<T>( this._length - 1, this.shift, newRoot, node )
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

	protected pushLeaf( shift: number, i: number, root: VectorNode<T>, tail: T[] ): T[] {
		if ( root !== undefined ) {
			const newRoot = cloneArray( root )
			let node = newRoot
			for ( let level = shift; level > BITS; level -= BITS) {
				const subidx = (i >>> level) & MASK
				let child = node[subidx]
				if ( child === undefined ) {
					node[subidx] = this.newPath( level - BITS, tail )
					return newRoot
				}
				child = cloneArray( child )
				node[subidx] = child
				node = child
			}
			node[(i >>> BITS) & MASK] = tail
			return newRoot
		} else {
			return []
		}
	}

	tailSize() {
		return (this._length === 0) ? 0 : ((this._length-1) & 31) + 1
	}

	/*
	[Symbol.iterator]() {
		return Vector.makeIterator<T>( this._length, this.shift, this.root, this.tail )
	}
	 */
	forEach<Z>( callbackfn: (this: Z, value: T, index: number, vec: Vector<T>) => void, thisArg?: Z ): void {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )
		}
	}

	reduce( callbackfn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduce<U>( callbackfn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		const iter = this.iterator()
		let acc = initialValue
		while ( iter.hasNext()) {
			acc = callbackfn.call( acc, iter.getNext(), iter.index-1, this )
		}
		return acc
	}
	
	reduceRight( callbackfn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduceRight<U>( callbackfn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		let acc = initialValue
		for ( let i = this._length-1; i >= 0; i-- ) {
			acc = callbackfn.call( acc, this.get( i ), i, this )
		}
		return acc
	}

	filter<Z>( callbackfn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): Vector<T> {	
		const iter = this.iterator()
		const tVec = new TransientVector<T>()
		while ( iter.hasNext()) {
			const v = iter.getNext()
			if ( callbackfn.call( thisArg, v, iter.index - 1, this )) {
				tVec.push( v )
			}
		}
		return Vector.ofTransient( tVec )
	}

	slice( start: number = 0, end: number = this.length ): Vector<T> {
		start = start < 0 ? this.length + start : start
		end = Math.min( this.length, end < 0 ? this.length + end : end )
		const tVec = new TransientVector<T>()
		if ( start < end && end <= this.length ) {
			for ( let i = start; i < end; i++ ) {
				tVec.push( (<T>this.get( i )))
			}
		}
		return Vector.ofTransient( tVec )
	}

	map<Z,U>( callbackfn: ( this: Z, value: T, index: number, vec: Vector<T> ) => U, thisArg?: Z ): Vector<T> {
		const iter = this.iterator()
		const tVec = new TransientVector<T>()
		while ( iter.hasNext()) {
			tVec.push( callbackfn.call( thisArg, iter.getNext(), iter.index-1, this ))
		}
		return Vector.ofTransient( tVec )
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
	
	every<Z>( callbackfn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( !callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )) {
				return false
			}
		}
		return true
	}

	some<Z>( callbackfn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )) {
				return true
			}
		}
		return false
	}

	concat( ...vectors: Vector<T>[] ): Vector<T> {
		let vec: Vector<T> = this
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

	reverse(): Vector<T> {
		let tVec = new TransientVector<T>()
		for ( let i = this._length-1; i >= 0; i-- ) {
			tVec.push(( <T>this.get( i )))
		}
		return Vector.ofTransient( tVec )
	}

	sort( compareFn?: (a: T, b: T) => number ): Vector<T> {
		return new Vector<T>( this.toArray().sort( compareFn ))
	}

	count<Z>( callbackfn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): number {
		let counter = 0
		const iter = this.iterator()
		while ( iter.hasNext()) {
			if ( callbackfn.call( thisArg, iter.getNext(), iter.index-1, this )) {
				counter++
			}
		}
		return counter
	}

	iterator(): VectorIterator<T> {
		return new VectorIterator<T>( this._length, this.shift, this.root, this.tail )
	}
}
