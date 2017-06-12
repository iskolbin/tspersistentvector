import {VectorIterator} from './VectorIterator'
import {TransientVector} from './TransientVector'
import * as Vec from './Vec'

export class Vector<T> {
	protected vec: Vec.Vec<T>

	constructor( array?: T[] ) {
		this.vec = Vec.make( array )
	}

	static ofVec<T>( vec: Vec.Vec<T> ): Vector<T> {
		const result = new Vector<T>()
		result.vec = vec
		return result
	}

	static of<T>( ...args: T[] ) {
		return Vector.ofVec( Vec.of( ...args ))
	}

	static is( vec: any ) {
		return vec instanceof Vector
	}

	static ofValue<T>( val: T, length: number ) {
		return Vector.ofVec( Vec.ofValue( val, length ))
	}

	static ofTransient<T>( tVec: TransientVector<T> ): Vector<T> {
		return Vector.ofVec( Vec.ofTransient( tVec ))
	}

	static range( start: number, finish?: number, step?: number ): Vector<number> {
		return Vector.ofVec( Vec.range( start, finish, step ))
	}

	clear(): Vector<T> {
		return Vector.ofVec( Vec.clear( this.vec ))
	}

	last(): T | undefined {
		return Vec.last( this.vec )
	}

	first(): T | undefined {
		return Vec.first( this.vec )
	}

	isEmpty(): boolean {
		return Vec.isEmpty( this.vec )
	}

	get length() {
		return this.vec.length
	}

	get( i: number ): T | undefined {
		return Vec.get( this.vec, i )
	}

	push( ...values: T[] ): Vector<T> {
		return Vector.ofVec( Vec.push( this.vec, ...values ))
	}

	set( i: number, val: T ): Vector<T> {
		return Vector.ofVec( Vec.set( this.vec, i, val ))
	}

	update( i: number, callbackFn: (v: T, i: number, vec: Vector<T>) => T ): Vector<T> {
		return Vector.ofVec( Vec.update( this.vec, i, callbackFn, this ))
	}

	pop(): Vector<T> | undefined {
		return Vector.ofVec( Vec.pop( this.vec ))
	}
	
	forEach<Z>( callbackFn: (this: Z, value: T, index: number, vec: Vector<T>) => void, thisArg?: Z ): void {
		Vec.forEach( this.vec, callbackFn, thisArg, this )
	}

	reduce( callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduce<U>( callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		return Vec.reduce( (<any>this.vec), (<any>callbackFn), (<any>initialValue), this )
	}
	
	reduceRight( callbackFn: ( previousValue: T, currentValue: T, currentIndex: number, vec: Vector<T> ) => T, initialValue?: T ): T
	reduceRight<U>( callbackFn: ( previousValue: U, currentValue: T, currentIndex: number, vec: Vector<T> ) => U, initialValue: U ): U {
		return Vec.reduceRight( (<any>this.vec), (<any>callbackFn), (<any>initialValue), this )
	}

	filter<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => any, thisArg?: Z ): Vector<T> {	
		return Vector.ofVec( Vec.filter( this.vec, callbackFn, thisArg, this ))
	}

	slice( start: number = 0, end: number = this.length ): Vector<T> {
		return Vector.ofVec( Vec.slice( this.vec, start, end ))
	}

	splice( start: number, deleteCount?: number, ...items: T[] ): Vector<T> {
		return Vector.ofVec( Vec.splice( this.vec, start, deleteCount, ...items ))
	}

	map<Z,U>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => U, thisArg?: Z ): Vector<T> {
		return Vector.ofVec( Vec.map( this.vec, callbackFn, thisArg, this ))
	}

	indexOf( v: T ): number {
		return Vec.indexOf( this.vec, v )
	}

	lastIndexOf( v: T ): number {
		return Vec.lastIndexOf( this.vec, v )
	}

	toArray(): T[] {
		return Vec.toArray( this.vec )
	}
	
	every<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		return Vec.every( this.vec, callbackFn, thisArg, this )
	}

	some<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): boolean {
		return Vec.some( this.vec, callbackFn, thisArg, this )
	}

	concat( ...vectors: Vector<T>[] ): Vector<T> {
		let vecs = vectors.map( ({vec}) => vec )
		return Vector.ofVec( Vec.concat( this.vec, ...vecs ))
	}

	join( separator: string = ',' ): string {
		return Vec.join( this.vec, separator )
	}

	toString() {
		return this.join()
	}

	reverse(): Vector<T> {
		return Vector.ofVec( Vec.reverse( this.vec ))
	}

	sort( compareFn?: (a: T, b: T) => number ): Vector<T> {
		return Vector.ofVec( Vec.sort( this.vec, compareFn ))
	}

	count<Z>( callbackFn: ( this: Z, value: T, index: number, vec: Vector<T> ) => boolean, thisArg?: Z ): number {
		return Vec.count( this.vec, callbackFn, thisArg, this )
	}

	iterator(): VectorIterator<T> {
		return Vec.iterator( this.vec )
	}
}

if ( typeof Symbol !== 'undefined' && typeof Symbol.iterator !== 'undefined' ){
	(<any>Vector).prototype[Symbol.iterator] = Vector.prototype.iterator
}

