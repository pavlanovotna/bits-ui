import { boxAutoReset } from "./boxAutoReset.svelte.js";

export type Typeahead = ReturnType<typeof useTypeahead>;

type TypeaheadOpts = {
	onMatch?: (item: HTMLElement) => void;
	getCurrentItem?: () => HTMLElement | null;
};

export function useTypeahead(opts?: TypeaheadOpts) {
	// Reset `search` 1 second after it was last updated
	const search = boxAutoReset("", 1000);

	const onMatch = opts?.onMatch ?? ((node) => node.focus());
	const getCurrentItem =
		opts?.getCurrentItem ?? (() => document.activeElement as HTMLElement | null);

	function handleTypeaheadSearch(key: string, candidates: HTMLElement[]) {
		if (!candidates.length) return;

		search.current = search.current + key;
		const currentItem = getCurrentItem();
		const currentMatch =
			candidates.find((item) => item === currentItem)?.textContent?.trim() ?? "";
		const values = candidates.map((item) => item.textContent?.trim() ?? "");
		const nextMatch = getNextMatch(values, search.current, currentMatch);
		const newItem = candidates.find((item) => item.textContent?.trim() === nextMatch);
		if (newItem) {
			onMatch(newItem);
		}
		return newItem;
	}

	function resetTypeahead() {
		search.current = "";
	}

	return {
		search,
		handleTypeaheadSearch,
		resetTypeahead,
	};
}

/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */
export function wrapArray<T>(array: T[], startIndex: number) {
	return array.map((_, index) => array[(startIndex + index) % array.length]) as T[];
}

/**
 * This is the "meat" of the typeahead matching logic. It takes in all the values,
 * the search and the current match, and returns the next match (or `undefined`).
 *
 * We normalize the search because if a user has repeatedly pressed a character,
 * we want the exact same behavior as if we only had that one character
 * (ie. cycle through options starting with that character)
 *
 * We also reorder the values by wrapping the array around the current match.
 * This is so we always look forward from the current match, and picking the first
 * match will always be the correct one.
 *
 * Finally, if the normalized search is exactly one character, we exclude the
 * current match from the values because otherwise it would be the first to match always
 * and focus would never move. This is as opposed to the regular case, where we
 * don't want focus to move if the current match still matches.
 */
export function getNextMatch(values: string[], search: string, currentMatch?: string) {
	const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
	const normalizedSearch = isRepeated ? search[0]! : search;
	const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
	let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
	const excludeCurrentMatch = normalizedSearch.length === 1;
	if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) =>
		value?.toLowerCase().startsWith(normalizedSearch.toLowerCase())
	);
	return nextMatch !== currentMatch ? nextMatch : undefined;
}