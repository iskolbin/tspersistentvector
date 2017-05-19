export function cloneArray<T>( xs: T[] ): T[] {
	const ret = new Array<T>( xs.length )
	let i = xs.length
	while ( i-- ) {
		ret[i] = xs[i]
	}
	return ret
}
