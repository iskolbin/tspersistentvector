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
const EMPTY_TAIL: any[] = [] 

export type Tree<T> = any[] | null

export class PersistentVector<T> {
	constructor( 
		protected length = 0,
		protected shift = 0,
		protected root: Tree<T> | null = null,
		protected tail: T[] = EMPTY_TAIL ) {
	}    

	clone(): PersistentVector<T> {
		return new PersistentVector<T>( this.length, this.shift, this.root, this.tail )
	}

	get( i: number ): T | undefined {
		if ( i >= this.length ) {
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

	push( val: T ): PersistentVector<T> {
		const ts = this.length === 0 ? 0 : ((this.length - 1) & MASK) + 1
		if ( ts !== BRANCHING ) {
			const newTail = clone( this.tail )
			newTail.push( val )
			return new PersistentVector<T>( this.length + 1, this.shift, this.root, newTail )
		}
		else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == BRANCHING, then tail is new root
			if ( this.length === BRANCHING ) {
				return new PersistentVector<T>( this.length + 1, 0, this.tail, newTail )
			}
			// check if the root is completely filled. Must also increment
			// shift if that's the case.
			let newRoot
			let newShift = this.shift
			if (( this.length >>> BITS ) > ( 1 << this.shift )) {
				newShift += BITS
				newRoot = new Array( BRANCHING )
				newRoot[0] = this.root
				newRoot[1] = this.newPath( this.shift, this.tail )
				return new PersistentVector<T>( this.length + 1, newShift, newRoot, newTail )
			} else { // still space in root
				newRoot = this.pushLeaf( this.shift, this.length - 1, this.root, this.tail )
				return new PersistentVector<T>( this.length + 1, this.shift, newRoot, newTail )
			}
		}
	}

	set( i: number, val: T ): PersistentVector<T> | undefined {
		if ( i >= this.length || this.root === null ) {
			return undefined
		} else if (i >= this.tailOffset()) {
			const newTail = clone( this.tail )
			newTail[i & MASK] = val
			return new PersistentVector<T>( this.length, this.shift, this.root, newTail )
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
			return new PersistentVector<T>( this.length, this.shift, newRoot, this.tail )
		}
	}

	pop(): PersistentVector<T> | undefined {
		if ( this.length === 0 || this.root === null ) {
			return undefined
		} else if ( this.length === 1 ) {
			return new PersistentVector<T>()
		} else if ((( this.length - 1 ) & 31 ) > 0 ) {
			// This one is curious: having int ts_1 = ((size-1) & 31) and using
			// it is slower than using tail.length - 1 and newTail.length!
			const newTail = clone( this.tail )
			newTail.pop()
			return new PersistentVector<T>(this.length - 1, this.shift, this.root, newTail)
		}
		const newTrieSize = this.length - BRANCHING - 1
		// special case: if new size is 32, then new root turns is null, old
		// root the tail
		if ( newTrieSize === 0 ) {
			return new PersistentVector<T>(BRANCHING, 0, null, this.root)
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
			return new PersistentVector<T>(this.length - 1, lowerShift, newRoot, node)
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
				node[subidx] = null
				node = child
			} else {
				child = clone( child )
				node[subidx] = child
				node = child
			}
		}
		return new PersistentVector<T>( this.length - 1, this.shift, newRoot, node )
	}



	protected tailOffset(): number {
		return (this.length - 1) & (~MASK)
	}

	protected newPath( levels: number, tail: T[] ): T[] {
		let topNode = tail
		for ( let level = levels; level > 0; level -= BITS ) {
			let newTop = new Array( BRANCHING )
			newTop[0] = topNode
			topNode = newTop
		}
		return topNode
	}

	protected pushLeaf( shift: number, i: number, root: Tree<T>, tail: T[] ): T[] {
		if ( root !== null ) {
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
}
