import {useState, useEffect} from "react";


export default function useMemorization<T>(inputValue: T | (() => T), memorize: boolean) {
	const [memorizedValue, setMemorizedValue] = useState(inputValue);

	useEffect(() => {
		if (memorize) {return;}
		setMemorizedValue(inputValue);
	}, [inputValue, memorize]);

	return memorizedValue;
}

