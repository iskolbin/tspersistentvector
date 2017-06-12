import { VectorIterator } from './VectorIterator'
import { TransientVector } from './TransientVector'
import { VectorNode } from './VectorNode'

export interface Vec<T> {
	length: number
	shift: number
	root: VectorNode<T>
	tail: T[]
}

const EMPTY_TAIL: any[] = []

const EMPTY_VECTOR: Vec<any> = {
	length: 0,
	shift: 0,
	root: undefined,
	tail: EMPTY_TAIL
}

function makeVec<T>( length: number, shift: number, root: VectorNode<T>, tail: T[] ) {
	return { length, shift, root, tail }
}

export function ofTransient<T>( tVec: TransientVector<T> ): Vec<T> {
	const result = {
		length: tVec.length,
		shift: tVec.shift,
		root: tVec.root,
		tail: tVec.tail
	}
	tVec.length = 0
	tVec.shift = 0
	tVec.root = undefined
	tVec.tail = EMPTY_TAIL
	return result
}

export function make<T>( arraylike?: T[] ): Vec<T> {
	return ofTransient( new TransientVector( arraylike ))
}

export function of<T>( ...args: T[] ): Vec<T> {
	return make( args )
}

export function ofValue<T>( val: T, length: number ): Vec<T> {
	const tVec = new TransientVector<T>()
	for ( let i = 0; i < length; i++ ) {
		tVec.push( val )
	}
	return ofTransient( tVec )
}

export function range( start: number, finish?: number, step?: number ): Vec<number> {
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
	return ofTransient( tVec )
}


export function clone<T>( {length, shift, root, tail}: Vec<T> ): Vec<T> {
	return {length, shift, root, tail}
}

export function clear<T>( _vec: Vec<T> ): Vec<T> {
	return EMPTY_VECTOR as Vec<T>
}

export function last<T>( vec: Vec<T> ): T | undefined {
	return get( vec, vec.length - 1 )
}

export function first<T>( vec: Vec<T> ): T | undefined {
	return get( vec, 0 )
}

export function isEmpty<T>( {length} : Vec<T> ): boolean {
	return length === 0
}

function tailOffset<T>( vec: Vec<T> ): number {
	return (vec.length - 1) & (~31)
}

export function get<T>( vec: Vec<T>, i: number ): T | undefined {
	if ( i < 0 || i >= vec.length ) {
		return undefined
	} else if ( i >= tailOffset( vec ) ) {
		return vec.tail[i & 31]
	} else {
		let node: any = vec.root
		for ( let level = vec.shift; level > 0; level -= 5) {
			node = node[(i >>> level) & 31]
		}
		return node[i & 31]
	}
}

function cloneArray<T>( xs: T[] | undefined ): T[] {
	if ( xs ) {
		return [...xs]
	} else {
		return []
	}
}

export function push<T>( vec: Vec<T>, ...values: T[] ): Vec<T> {
	for ( const val of values ) {
		const ts = vec.length === 0 ? 0 : ((vec.length - 1) & 31) + 1
		if ( ts !== 32 ) {
			const newTail = cloneArray( vec.tail )
			newTail.push( val )
			vec = makeVec( vec.length + 1, vec.shift, vec.root, newTail )
		} else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == 32, then tail is new root
			if ( vec.length === 32 ) {
				vec = makeVec( vec.length + 1, 0, vec.tail, newTail )
			}
			// check if the root is completely filled. Must also increment
			// shift if that's the case.
			let newRoot
			let newShift = vec.shift
			if (( vec.length >>> 5 ) > ( 1 << vec.shift )) {
				newShift += 5
				newRoot = new Array( 32 )
				newRoot[0] = vec.root
				newRoot[1] = newPath( vec.shift, vec.tail )
				vec = makeVec( vec.length + 1, newShift, newRoot, newTail )
			} else { // still space in root
				newRoot = pushLeaf( vec.shift, vec.length - 1, vec.root, vec.tail )
				vec = makeVec( vec.length + 1, vec.shift, newRoot, newTail )
			}
		}
	}
	return vec
}

export function set<T>( vec: Vec<T>, i: number, val: T ): Vec<T> {
	if ( i < 0 || i >= vec.length || vec.root === undefined ) {
		return vec
	} else if (i >= tailOffset( vec )) {
		const newTail = [...vec.tail]
		newTail[i & 31] = val
		return makeVec<T>( vec.length, vec.shift, vec.root, newTail )
	} else {
		const newRoot = cloneArray( vec.root )
		let node = newRoot
		for ( let level = vec.shift; level > 0; level -= 5 ) {
			const subidx = (i >>> level) & 31
			let child = node[subidx]
			child = cloneArray( child )
			node[subidx] = child
			node = child
		}
		node[i & 31] = val
		return makeVec<T>( vec.length, vec.shift, newRoot, vec.tail )
	}
}


export function update<T,K>( vec: Vec<T>, i: number, callbackFn: (v: T, i: number, arg: K) => T, callbackArg: any = vec ): Vec<T> {
	const v = get( vec, i )
	if ( v !== undefined ) {
		return set( vec, i, callbackFn( v, i, callbackArg ))
	} else {
		return vec
	}
}

export function pop<T>( vec: Vec<T> ): Vec<T> {
	if ( vec.length <= 1 || vec.root === undefined ) {
		return EMPTY_VECTOR
	} else if ((( vec.length - 1 ) & 31 ) > 0 ) {
		// This one is curious: having int ts_1 = ((size-1) & 31) and using
		// it is slower than using tail.length - 1 and newTail.length!
		const newTail = [...vec.tail]
		newTail.pop()
		return makeVec<T>(vec.length - 1, vec.shift, vec.root, newTail)
	}
	const newTrieSize = vec.length - 32 - 1
	// special case: if new size is 32, then new root turns is undefined, old
	// root the tail
	if ( newTrieSize === 0 ) {
		return makeVec<T>(32, 0, undefined, vec.root)
	}
	// check if we can reduce the trie's height
	if ( newTrieSize === 1 << vec.shift ) { // can lower the height
		const lowerShift = vec.shift - 5
		const newRoot = vec.root[0]

		// find new tail
		let node = vec.root[1]
		for ( let level = lowerShift; level > 0; level -= 5) {
			node = node[0]
		}
		return makeVec<T>(vec.length - 1, lowerShift, newRoot, node)
	}

	// diverges contain information on when the path diverges.
	const diverges = newTrieSize ^ (newTrieSize - 1)
	let hasDiverged = false
	const newRoot = cloneArray( vec.root )
	let node = newRoot
	for ( let level = vec.shift; level > 0; level -= 5) {
		const subidx = (newTrieSize >>> level) & 31
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
	return makeVec<T>( vec.length - 1, vec.shift, newRoot, node )
}


function newPath<T>( levels: number, tail: T[] ): T[] {
	let topNode = tail
	for ( let level = levels; level > 0; level -= 5 ) {
		const newTop = new Array( 32 )
		newTop[0] = topNode
		topNode = newTop
	}
	return topNode
}

function pushLeaf<T>( shift: number, i: number, root: VectorNode<T>, tail: T[] ): T[] {
	if ( root !== undefined ) {
		const newRoot = cloneArray( root )
		let node = newRoot
		for ( let level = shift; level > 5; level -= 5) {
			const subidx = (i >>> level) & 31
			let child = node[subidx]
			if ( child === undefined ) {
				node[subidx] = newPath( level - 5, tail )
				return newRoot
			}
			child = cloneArray( child )
			node[subidx] = child
			node = child
		}
		node[(i >>> 5) & 31] = tail
		return newRoot
	} else {
		return []
	}
}

export function iterator<T>( vec: Vec<T> ): VectorIterator<T> {
	return new VectorIterator<T>( vec.length, vec.shift, vec.root, vec.tail )
}

export function forEach<T,Z,K>( vec: Vec<T>, callbackFn: (this: Z, value: T, index: number, arg: K) => void, thisArg?: Z, callbackArg: any = vec ): void {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )
	}
}

export function reduce<T,K>( vec: Vec<T>, callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, arg: K ) => T, initialValue?: T, callbackArg?: any ): T
export function reduce<T,K,U>( vec: Vec<T>, callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, arg: K ) => U, initialValue: U, callbackArg: any = vec ): U {
	const iter = iterator( vec )
	let acc = initialValue
	if ( initialValue === undefined && iter.hasNext()) {
		acc = (<any>iter.getNext())
	}
	while ( iter.hasNext()) {
		acc = callbackFn.call( null, acc, iter.getNext(), iter.index-1, callbackArg )
	}
	return acc
}
	
export function reduceRight<T,K>( vec: Vec<T>, callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, arg: K ) => T, initialValue?: T, callbackArg?: any ): T
export function reduceRight<T,K,U>( vec: Vec<T>, callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, arg: K ) => U, initialValue: U, callbackArg: any = vec ): U {
	let acc = initialValue
	let start = vec.length-1
	if ( initialValue === undefined && vec.length > 0 ) {
		acc = (<any>get( vec, start-- ))
	}
	for ( let i = start; i >= 0; i-- ) {
		acc = callbackFn.call( null, acc, get( vec, i ), i, callbackArg )
	}
	return acc
}

export function filter<T,K,Z>( vec: Vec<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => any, thisArg?: Z, callbackArg: any = vec ): Vec<T> {	
	const iter = iterator( vec )
	const tVec = new TransientVector<T>()
	while ( iter.hasNext()) {
		const v = iter.getNext()
		if ( callbackFn.call( thisArg, v, iter.index - 1, callbackArg )) {
			tVec.push( v )
		}
	}
	return ofTransient( tVec )
}

export function slice<T>( vec: Vec<T>, start: number = 0, end: number = vec.length ): Vec<T> {
	start = start < 0 ? vec.length + start : start
	end = Math.min( vec.length, end < 0 ? vec.length + end : end )
	const tVec = new TransientVector<T>()
	if ( start < end && end <= vec.length ) {
		for ( let i = start; i < end; i++ ) {
			tVec.push( (<T>get( vec, i )))
		}
	}
	return ofTransient( tVec )
}

export function map<T,K,Z,U>( vec: Vec<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => U, thisArg?: Z, callbackArg: any = vec ): Vec<T> {
	const iter = iterator( vec )
	const tVec = new TransientVector<T>()
	while ( iter.hasNext()) {
		tVec.push( callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg ))
	}
	return ofTransient( tVec )
}

export function indexOf<T>( vec: Vec<T>, v: T ): number {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( iter.getNext() === v ) {
			return iter.index-1
		}
	}
	return -1
}

export function lastIndexOf<T>( vec: Vec<T>, v: T ): number {
	for ( let i = vec.length-1; i >= 0; i-- ) {
		if ( get( vec, i ) === v ) {
			return i
		}
	}
	return -1
}

export function toArray<T>( vec: Vec<T> ): T[] {
	const iter = iterator( vec )
	const array: T[] = []
	while ( iter.hasNext()) {
		array.push( iter.getNext())
	}
	return array
}
	
export function every<T,K,Z>( vec: Vec<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): boolean {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( !callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )) {
			return false
		}
	}
	return true
}

export function some<T,K,Z>( vec: Vec<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): boolean {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )) {
			return true
		}
	}
	return false
}

export function concat<T>( ...vectors: Vec<T>[] ): Vec<T> {
	if ( vectors.length === 0 ) {
		return EMPTY_VECTOR
	} else {
		let result = vectors[0]
		for ( let i = 1; i < vectors.length; i++ ) {
			const iter = iterator( vectors[i] )
			while ( iter.hasNext()) {
				result = push( result, iter.getNext())
			}
		}
		return result
	}
}

export function join<T>( vec: Vec<T>, separator: string = ',' ): string {
	const iter = iterator( vec ) 
	const strAcc: string[] = []
	while ( iter.hasNext()) {
		strAcc.push( iter.getNext().toString() )
	}
	return strAcc.join( separator )
}

export function toString<T>( vec: Vec<T> ) {
	return join( vec )
}

export function reverse<T>( vec: Vec<T> ): Vec<T> {
	let tVec = new TransientVector<T>()
	for ( let i = vec.length-1; i >= 0; i-- ) {
		tVec.push(( <T>get( vec, i )))
	}
	return ofTransient( tVec )
}

export function sort<T>( vec: Vec<T>, compareFn?: (a: T, b: T) => number ): Vec<T> {
	return make( toArray( vec ).sort( compareFn ))
}

export function count<T,K,Z>( vec: Vec<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): number {
	
	let counter = 0
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )) {
			counter++
		}
	}
	return counter
}

// TODO make more efficient
export function splice<T>( vec: Vec<T>, start: number, deleteCount: number = vec.length-start, ...items: T[] ) {
	const arr = toArray( vec )
	arr.splice( start, deleteCount, ...items )
	return make( arr )
}
