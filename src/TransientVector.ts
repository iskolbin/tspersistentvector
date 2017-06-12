import { VectorNode } from './VectorNode'

export class TransientVector<T> {
	length = 0
	shift = 0
	root: VectorNode<T> = undefined
	tail: T[] = []
	
	constructor( arraylike?: T[] ) {
		if ( arraylike ) {
			for ( const v of arraylike ) {
				this.push( v )
			}
		}
	}
	
	protected pushLeaf( shift: number, i: number, root: VectorNode<T>, tail: T[] ): T[] {
		if ( root !== undefined ) {
			let node = root
			for ( let level = shift; level > 5; level -= 5 ) {
				const subidx = (i >>> level) & 31
				let child = node[subidx]
				if ( child === undefined ) {
					node[subidx] = this.newPath( level - 5, tail )
					return root
				}
				node[subidx] = child
				node = child
			}
			node[(i >>> 5) & 31] = tail
			return root
		} else {
			return []
		}
	}

	push( val: T ): TransientVector<T> {
		const ts = this.length === 0 ? 0 : ((this.length - 1) & 31) + 1
		if ( ts !== 32 ) {
			this.tail.push( val )
		} else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == 32, then tail is new root
			if ( this.length === 32 ) {
				this.root = this.tail
				this.tail = newTail
			} else {
				// check if the root is completely filled. Must also increment
				// shift if that's the case.
				if (( this.length >>> 5 ) > ( 1 << this.shift )) {
					const newRoot = new Array( 32 )
					newRoot[0] = this.root
					newRoot[1] = this.newPath( this.shift, this.tail )
					this.shift += 5
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
		for ( let level = levels; level > 0; level -= 5 ) {
			const newTop = new Array( 32 )
			newTop[0] = topNode
			topNode = newTop
		}
		return topNode
	}
}
