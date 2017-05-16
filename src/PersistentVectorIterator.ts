import { PersistentVectorNode } from './PersistentVector'

export class PersistentVectorIterator<T> {
	protected stack: Array<PersistentVectorNode<T>>
	protected leaf: PersistentVectorNode<T>
  protected _index: number
	protected jump: number
	protected size: number
	protected tail: T[]

	get index(): number {
		return this._index
	}

	constructor( size: number, shift: number, root: PersistentVectorNode<T>, tail: T[] ) {
		this.size = size
		this.tail = tail
		this._index = 0
		this.jump = 32
    // top is at the end, and rank 2 nodes are at the front
		this.stack = new Array<PersistentVectorNode<T>>( shift/5 )
		if ( size <= 32 ) {
			this.leaf = tail
		} else if ( size <= 64 ) {
			this.leaf = root
		} else {
			this.stack[this.stack.length-1] = root
			for ( let i = this.stack.length-2; i >= 0; i-- ) {
				this.stack[i] = (<any[]>this.stack[i+1])[0]
			}
			this.leaf = (<any>this.stack[0])[0]
		}
	}

	hasNext(): boolean {
		return this._index < this.size
	}

	getNext(): T {
		if ( this._index === this.jump ) {
			if ( this._index >= (( this.size - 1 ) & ( ~31 ))) {
				this.leaf = this.tail
			} else {
				this.jump += 32
				const diff = this._index ^ (this._index - 1)
				// there is at least one jump, so skip first check
				let level = 10
				let stackUpdates = 0
				// count number of nodes we have to rewind back up
				while (( diff >>> level ) !== 0 ) {
					stackUpdates++
					level += 5
				}
				level -= 5
				// rewrite stack if need be
				while ( stackUpdates > 0 ) {
					this.stack[stackUpdates - 1] = (<any[]>this.stack[stackUpdates])[(this._index >>> level) & 31]
					stackUpdates--
					level -= 5
				}
				this.leaf = (<any[]>this.stack[0])[(this._index >>> 5) & 31]
			}
		}
		if ( !this.hasNext() ) {
			throw new Error( 'Iterator is finished' )
		} else {
			return (<any>this.leaf)[this._index++ & 31]
		}	
	}

	next(): { value: T | undefined, done: boolean } {	
		return this.hasNext() ?
			{ value: this.getNext(), done: false } :
			{ value: undefined, done: true }
	}
}
