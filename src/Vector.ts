import {VectorNode} from './VectorNode'
import {VectorIterator} from './VectorIterator'
import {TransientVector} from './TransientVector'

export interface Data<T> {
	size: number
	shift: number
	root: VectorNode<T>
	tail: T[]
}

const EMPTY_TAIL: any[] = []

export const NIL: Data<any> = {
	size: 0,
	shift: 0,
	root: undefined,
	tail: EMPTY_TAIL
}

function makeData<T>( size: number, shift: number, root: VectorNode<T>, tail: T[] ) {
	return { size, shift, root, tail }
}

export function ofTransient<T>( tvec: TransientVector<T> ): Data<T> {
	const result = {
		size: tvec.size,
		shift: tvec.shift,
		root: tvec.root,
		tail: tvec.tail
	}
	tvec.size = 0
	tvec.shift = 0
	tvec.root = undefined
	tvec.tail = EMPTY_TAIL
	return result
}

export function make<T>( arraylike?: T[] ): Data<T> {
	return ofTransient( new TransientVector( arraylike ))
}

export function of<T>( ...args: T[] ): Data<T> {
	return make( args )
}

export function ofValue<T>( val: T, size: number ): Data<T> {
	const tvec = new TransientVector<T>()
	for ( let i = 0; i < size; i++ ) {
		tvec.push( val )
	}
	return ofTransient( tvec )
}

export function range( start: number, finish?: number, step?: number ): Data<number> {
	if ( finish === undefined ) {
		finish = start
		start = 0
	}
	if ( step === undefined ) {
		step = start > finish ? -1 : 1
	}
	const tvec = new TransientVector<number>()
	if (( start < finish && step > 0 ) || ( start > finish && step < 0 )) {
		if ( start > finish ) {
			for ( let i = start; i > finish; i += step ) {
				tvec.push( i )
			}
		} else {
			for ( let i = start; i < finish; i += step ) {
				tvec.push( i )
			}
		}
	}
	return ofTransient( tvec )
}


export function clone<T>( {size, shift, root, tail}: Data<T> ): Data<T> {
	return {size, shift, root, tail}
}

export function clear<T>( _vec: Data<T> ): Data<T> {
	return NIL as Data<T>
}

export function last<T>( vec: Data<T> ): T | undefined {
	return get( vec, vec.size - 1 )
}

export function first<T>( vec: Data<T> ): T | undefined {
	return get( vec, 0 )
}

export function isEmpty<T>( {size} : Data<T> ): boolean {
	return size === 0
}

function tailOffset<T>( vec: Data<T> ): number {
	return (vec.size - 1) & (~31)
}

export function get<T>( vec: Data<T>, i: number ): T | undefined {
	if ( i < 0 || i >= vec.size ) {
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

export function push<T>( vec: Data<T>, ...values: T[] ): Data<T> {
	for ( const val of values ) {
		const ts = vec.size === 0 ? 0 : ((vec.size - 1) & 31) + 1
		if ( ts !== 32 ) {
			const newTail = cloneArray( vec.tail )
			newTail.push( val )
			vec = makeData( vec.size + 1, vec.shift, vec.root, newTail )
		} else { // have to insert tail into root.
			const newTail = [val]
			// Special case: If old size == 32, then tail is new root
			if ( vec.size === 32 ) {
				vec = makeData( vec.size + 1, 0, vec.tail, newTail )
			}
			// check if the root is completely filled. Must also increment
			// shift if that's the case.
			let newRoot
			let newShift = vec.shift
			if (( vec.size >>> 5 ) > ( 1 << vec.shift )) {
				newShift += 5
				newRoot = new Array( 32 )
				newRoot[0] = vec.root
				newRoot[1] = newPath( vec.shift, vec.tail )
				vec = makeData( vec.size + 1, newShift, newRoot, newTail )
			} else { // still space in root
				newRoot = pushLeaf( vec.shift, vec.size - 1, vec.root, vec.tail )
				vec = makeData( vec.size + 1, vec.shift, newRoot, newTail )
			}
		}
	}
	return vec
}

export function set<T>( vec: Data<T>, i: number, val: T ): Data<T> {
	if ( i < 0 || i >= vec.size || vec.root === undefined ) {
		return vec
	} else if (i >= tailOffset( vec )) {
		const newTail = [...vec.tail]
		newTail[i & 31] = val
		return makeData<T>( vec.size, vec.shift, vec.root, newTail )
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
		return makeData<T>( vec.size, vec.shift, newRoot, vec.tail )
	}
}


export function update<T,K>( vec: Data<T>, i: number, callbackFn: (v: T, i: number, arg: K) => T, callbackArg: any = vec ): Data<T> {
	const v = get( vec, i )
	if ( v !== undefined ) {
		return set( vec, i, callbackFn( v, i, callbackArg ))
	} else {
		return vec
	}
}

export function pop<T>( vec: Data<T> ): Data<T> {
	if ( vec.size <= 1 || vec.root === undefined ) {
		return NIL
	} else if ((( vec.size - 1 ) & 31 ) > 0 ) {
		// This one is curious: having int ts_1 = ((size-1) & 31) and using
		// it is slower than using tail.size - 1 and newTail.size!
		const newTail = [...vec.tail]
		newTail.pop()
		return makeData<T>(vec.size - 1, vec.shift, vec.root, newTail)
	}
	const newTrieSize = vec.size - 32 - 1
	// special case: if new size is 32, then new root turns is undefined, old
	// root the tail
	if ( newTrieSize === 0 ) {
		return makeData<T>(32, 0, undefined, vec.root)
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
		return makeData<T>(vec.size - 1, lowerShift, newRoot, node)
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
	return makeData<T>( vec.size - 1, vec.shift, newRoot, node )
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

export function iterator<T>( vec: Data<T> ): VectorIterator<T> {
	return new VectorIterator<T>( vec.size, vec.shift, vec.root, vec.tail )
}

export function forEach<T,Z,K>( vec: Data<T>, callbackFn: (this: Z, value: T, index: number, arg: K) => void, thisArg?: Z, callbackArg: any = vec ): void {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )
	}
}

export function reduce<T,K>( vec: Data<T>, callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, arg: K ) => T, initialValue?: T, callbackArg?: any ): T
export function reduce<T,K,U>( vec: Data<T>, callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, arg: K ) => U, initialValue: U, callbackArg: any = vec ): U {
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
	
export function reduceRight<T,K>( vec: Data<T>, callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, arg: K ) => T, initialValue?: T, callbackArg?: any ): T
export function reduceRight<T,K,U>( vec: Data<T>, callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, arg: K ) => U, initialValue: U, callbackArg: any = vec ): U {
	let acc = initialValue
	let start = vec.size-1
	if ( initialValue === undefined && vec.size > 0 ) {
		acc = (<any>get( vec, start-- ))
	}
	for ( let i = start; i >= 0; i-- ) {
		acc = callbackFn.call( null, acc, get( vec, i ), i, callbackArg )
	}
	return acc
}

export function filter<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => any, thisArg?: Z, callbackArg: any = vec ): Data<T> {	
	const iter = iterator( vec )
	const tvec = new TransientVector<T>()
	while ( iter.hasNext()) {
		const v = iter.getNext()
		if ( callbackFn.call( thisArg, v, iter.index - 1, callbackArg )) {
			tvec.push( v )
		}
	}
	return ofTransient( tvec )
}

export function filterNot<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => any, thisArg?: Z, callbackArg: any = vec ): Data<T> {
	const iter = iterator( vec )
	const tvec = new TransientVector<T>()
	while ( iter.hasNext()) {
		const v = iter.getNext()
		if ( !callbackFn.call( thisArg, v, iter.index - 1, callbackArg )) {
			tvec.push( v )
		}
	}
	return ofTransient( tvec )
}

export function slice<T>( vec: Data<T>, start: number = 0, end: number = vec.size ): Data<T> {
	start = start < 0 ? vec.size + start : start
	end = Math.min( vec.size, end < 0 ? vec.size + end : end )
	const tvec = new TransientVector<T>()
	if ( start < end && end <= vec.size ) {
		for ( let i = start; i < end; i++ ) {
			tvec.push( (<T>get( vec, i )))
		}
	}
	return ofTransient( tvec )
}

export function map<T,K,Z,U>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => U, thisArg?: Z, callbackArg: any = vec ): Data<T> {
	const iter = iterator( vec )
	const tvec = new TransientVector<T>()
	while ( iter.hasNext()) {
		tvec.push( callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg ))
	}
	return ofTransient( tvec )
}

export function indexOf<T>( vec: Data<T>, v: T ): number {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( iter.getNext() === v ) {
			return iter.index-1
		}
	}
	return -1
}

export function includes<T>( vec: Data<T>, v: T ): boolean {
	return indexOf( vec, v ) !== -1
}

export function lastIndexOf<T>( vec: Data<T>, v: T ): number {
	for ( let i = vec.size-1; i >= 0; i-- ) {
		if ( get( vec, i ) === v ) {
			return i
		}
	}
	return -1
}

export function find<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): T | undefined {
	const iter = iterator( vec )
	let index = 0
	while ( iter.hasNext()) {
		const value = iter.getNext()
		if ( callbackFn.call( thisArg, value, index++, callbackArg )) {
			return value
		}
	}
	return undefined
}

export function findLast<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): T | undefined {
	for ( let i = vec.size-1; i >= 0; i-- ) {
		const value = get( vec, i )
		if ( callbackFn.call( thisArg, value, i, callbackArg )) {
			return value
		}
	}
	return undefined
}

export function findIndex<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): number {
	const iter = iterator( vec )
	let index = 0
	while ( iter.hasNext()) {
		if ( callbackFn.call( thisArg, iter.getNext(), index++, callbackArg )) {
			return index
		}
	}
	return -1
}

export function findLastIndex<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): number {
	for ( let i = vec.size-1; i >= 0; i-- ) {
		if ( callbackFn.call( thisArg, get( vec, i ), i, callbackArg )) {
			return i
		}
	}
	return -1
}

export function toArray<T>( vec: Data<T> ): T[] {
	const iter = iterator( vec )
	const array: T[] = []
	while ( iter.hasNext()) {
		array.push( iter.getNext())
	}
	return array
}
	
export function every<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): boolean {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( !callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )) {
			return false
		}
	}
	return true
}

export function some<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): boolean {
	const iter = iterator( vec )
	while ( iter.hasNext()) {
		if ( callbackFn.call( thisArg, iter.getNext(), iter.index-1, callbackArg )) {
			return true
		}
	}
	return false
}

export function concat<T>( ...vectors: Data<T>[] ): Data<T> {
	const len = vectors.length
	if ( len === 0 ) {
		return NIL
	} else {
		let result = vectors[0]
		for ( let i = 1; i < len; i++ ) {
			const iter = iterator( vectors[i] )
			while ( iter.hasNext()) {
				result = push( result, iter.getNext())
			}
		}
		return result
	}
}

export function join<T>( vec: Data<T>, separator: string = ',' ): string {
	const iter = iterator( vec ) 
	const strAcc: string[] = []
	while ( iter.hasNext()) {
		strAcc.push( iter.getNext().toString() )
	}
	return strAcc.join( separator )
}

export function toString<T>( vec: Data<T> ) {
	return join( vec )
}

export function reverse<T>( vec: Data<T> ): Data<T> {
	let tvec = new TransientVector<T>()
	for ( let i = vec.size-1; i >= 0; i-- ) {
		tvec.push(( <T>get( vec, i )))
	}
	return ofTransient( tvec )
}

export function sort<T>( vec: Data<T>, compareFn?: (a: T, b: T) => number ): Data<T> {
	return make( toArray( vec ).sort( compareFn ))
}

export function count<T,K,Z>( vec: Data<T>, callbackFn: ( this: Z, value: T, index: number, arg: K ) => boolean, thisArg?: Z, callbackArg: any = vec ): number {
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
export function splice<T>( vec: Data<T>, start: number, deleteCount: number = vec.size-start, ...items: T[] ) {
	const arr = toArray( vec )
	arr.splice( start, deleteCount, ...items )
	return make( arr )
}

export function deleteAt<T>( vec: Data<T>, index: number ): Data<T> {
	if ( index >= 0 && index < vec.size ) {
		return splice( vec, index, 1 )
	} else {
		return vec
	}
}

export class Vector<T> {
	protected vec: Data<T>

	constructor( array?: T[] ) {
		this.vec = make( array )
	}

	static ofData<T>( vec: Data<T> ): Vector<T> {
		const result = new Vector<T>()
		result.vec = vec
		return result
	}

	static of<T>( ...args: T[] ) {
		return Vector.ofData( of( ...args ))
	}

	static is( vec: any ) {
		return vec instanceof Vector
	}

	static ofValue<T>( val: T, size: number ) {
		return Vector.ofData( ofValue( val, size ))
	}

	static ofTransient<T>( tvec: TransientVector<T> ): Vector<T> {
		return Vector.ofData( ofTransient( tvec ))
	}

	static range( start: number, finish?: number, step?: number ): Vector<number> {
		return Vector.ofData( range( start, finish, step ))
	}

	clear(): Vector<T> {
		return Vector.ofData( clear( this.vec ))
	}

	last(): T | undefined {
		return last( this.vec )
	}

	first(): T | undefined {
		return first( this.vec )
	}

	isEmpty(): boolean {
		return isEmpty( this.vec )
	}

	get size() {
		return this.vec.size
	}

	get( i: number ): T | undefined {
		return get( this.vec, i )
	}

	push( ...values: T[] ): Vector<T> {
		return Vector.ofData( push( this.vec, ...values ))
	}

	set( i: number, val: T ): Vector<T> {
		return Vector.ofData( set( this.vec, i, val ))
	}

	update( i: number, callbackFn: (v: T, i: number, vec: Vector<T>) => T ): Vector<T> {
		return Vector.ofData( update( this.vec, i, callbackFn, this ))
	}

	pop(): Vector<T> | undefined {
		return Vector.ofData( pop( this.vec ))
	}
	
	forEach<Z>( callbackFn: (this: Z, value: T, index: number, vec: Vector<T>) => void, thisArg?: Z ): void {
		forEach( this.vec, callbackFn, thisArg, this )
	}

	reduce( callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduce<U>( callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		return reduce( (<any>this.vec), (<any>callbackFn), (<any>initialValue), this )
	}
	
	reduceRight( callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduceRight<U>( callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		return reduceRight( (<any>this.vec), (<any>callbackFn), (<any>initialValue), this )
	}

	filter<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): Vector<T> {	
		return Vector.ofData( filter( this.vec, callbackFn, thisArg, this ))
	}

	filterNot<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): Vector<T> {	
		return Vector.ofData( filterNot( this.vec, callbackFn, thisArg, this ))
	}

	slice( start: number = 0, end: number = this.size ): Vector<T> {
		return Vector.ofData( slice( this.vec, start, end ))
	}

	splice( start: number, deleteCount?: number, ...items: T[] ): Vector<T> {
		return Vector.ofData( splice( this.vec, start, deleteCount, ...items ))
	}

	delete( index: number ): Vector<T> {
		return Vector.ofData( deleteAt( this.vec, index ))
	}

	map<Z,U>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => U, thisArg?: Z ): Vector<T> {
		return Vector.ofData( map( this.vec, callbackFn, thisArg, this ))
	}

	indexOf( v: T ): number {
		return indexOf( this.vec, v )
	}

	includes( v: T ): boolean {
		return includes( this.vec, v )
	}

	lastIndexOf( v: T ): number {
		return lastIndexOf( this.vec, v )
	}

	find<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): T | undefined {
		return find( this.vec, callbackFn, thisArg, this )
	}

	findLast<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): T | undefined {
		return findLast( this.vec, callbackFn, thisArg, this )
	}

	findIndex<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): number {
		return findIndex( this.vec, callbackFn, thisArg, this )
	}

	findLastIndex<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): number {
		return findLastIndex( this.vec, callbackFn, thisArg, this )
	}

	toArray(): T[] {
		return toArray( this.vec )
	}
	
	every<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		return every( this.vec, callbackFn, thisArg, this )
	}

	some<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		return some( this.vec, callbackFn, thisArg, this )
	}

	concat( ...vectors: Vector<T>[] ): Vector<T> {
		let vecs = vectors.map( ({vec}) => vec )
		return Vector.ofData( concat( this.vec, ...vecs ))
	}

	join( separator: string = ',' ): string {
		return join( this.vec, separator )
	}

	toString() {
		return this.join()
	}

	reverse(): Vector<T> {
		return Vector.ofData( reverse( this.vec ))
	}

	sort( compareFn?: (a: T, b: T) => number ): Vector<T> {
		return Vector.ofData( sort( this.vec, compareFn ))
	}

	count<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): number {
		return count( this.vec, callbackFn, thisArg, this )
	}

	iterator(): VectorIterator<T> {
		return iterator( this.vec )
	}
}

if ( typeof Symbol !== 'undefined' && typeof Symbol.iterator !== 'undefined' ){
	(<any>Vector).prototype[Symbol.iterator] = Vector.prototype.iterator
}
