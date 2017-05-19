import { VectorNode } from './VectorNode'
import { BITS, BRANCHING, MASK } from './VectorConst'

export class TransientVector<T> {
	length = 0
	shift = 0
	root: VectorNode<T> = undefined
	tail: T[] = []
	
	constructor() {
	}
	
	protected pushLeaf( shift: number, i: number, root: VectorNode<T>, tail: T[] ): T[] {
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

	push( val: T ): TransientVector<T> {
		const ts = this.length === 0 ? 0 : ((this.length - 1) & MASK) + 1
		if ( ts !== BRANCHING ) {
			this.tail.push( val )
		} else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == BRANCHING, then tail is new root
			if ( this.length === BRANCHING ) {
				this.root = this.tail
				this.tail = newTail
			} else {
				// check if the root is completely filled. Must also increment
				// shift if that's the case.
				if (( this.length >>> BITS ) > ( 1 << this.shift )) {
					const newRoot = new Array( BRANCHING )
					newRoot[0] = this.root
					newRoot[1] = this.newPath( this.shift, this.tail )
					this.shift += BITS
					this.root = newRoot
					this.tail = newTail
				} else { // still space in root
					this.root = this.pushLeaf( this.shift, this.length - 1, this.root, this.tail )
					this.tail = newTail
				}
			}
		}
		this.length++
		return this
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
}
