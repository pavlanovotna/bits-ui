import { getContext, setContext, tick, untrack } from "svelte";
import {
	type Box,
	type BoxedValues,
	type EventCallback,
	type ReadonlyBox,
	type ReadonlyBoxedValues,
	boxedState,
	composeHandlers,
	getAriaDisabled,
	getAriaExpanded,
	getDataDisabled,
	getDataOpenClosed,
	kbd,
	readonlyBox,
	styleToString,
	verifyContextDeps,
} from "$lib/internal/index.js";
import type { StyleProperties } from "$lib/shared/index.js";

/**
 * BASE
 */
type AccordionBaseStateProps = ReadonlyBoxedValues<{
	id: string;
	disabled: boolean;
}>;

class AccordionBaseState {
	id = undefined as unknown as ReadonlyBox<string>;
	disabled: ReadonlyBox<boolean>;
	#attrs = $derived({
		id: this.id.value,
		"data-accordion-root": "",
	} as const);

	constructor(props: AccordionBaseStateProps) {
		this.id = props.id;
		this.disabled = props.disabled;
	}

	get props() {
		return this.#attrs;
	}
}

/**
 * SINGLE
 */

type AccordionSingleStateProps = AccordionBaseStateProps & BoxedValues<{ value: string }>;

export class AccordionSingleState extends AccordionBaseState {
	#value: Box<string>;
	isMulti = false as const;

	constructor(props: AccordionSingleStateProps) {
		super(props);
		this.#value = props.value;
	}

	includesItem(item: string) {
		return this.#value.value === item;
	}

	toggleItem(item: string) {
		this.#value.value = this.includesItem(item) ? "" : item;
	}
}

/**
 * MULTIPLE
 */

type AccordionMultiStateProps = AccordionBaseStateProps & BoxedValues<{ value: string[] }>;

export class AccordionMultiState extends AccordionBaseState {
	#value: Box<string[]>;
	isMulti = true as const;

	constructor(props: AccordionMultiStateProps) {
		super(props);
		this.#value = props.value;
	}

	includesItem(item: string) {
		return this.#value.value.includes(item);
	}

	toggleItem(item: string) {
		if (this.includesItem(item)) {
			this.#value.value = this.#value.value.filter((v) => v !== item);
		} else {
			this.#value.value.push(item);
		}
	}
}

/**
 * ITEM
 */

type AccordionItemStateProps = ReadonlyBoxedValues<{
	value: string;
	disabled: boolean;
}> & {
	rootState: AccordionState;
};

export class AccordionItemState {
	#value: ReadonlyBox<string>;
	disabled = undefined as unknown as ReadonlyBox<boolean>;
	root = undefined as unknown as AccordionState;
	isSelected = $derived(this.root.includesItem(this.value));
	isDisabled = $derived(this.disabled.value || this.root.disabled.value);
	#attrs = $derived({
		"data-accordion-item": "",
		"data-state": getDataOpenClosed(this.isSelected),
		"data-disabled": getDataDisabled(this.isDisabled),
	} as const);

	constructor(props: AccordionItemStateProps) {
		this.#value = props.value;
		this.disabled = props.disabled;
		this.root = props.rootState;
	}

	get value() {
		return this.#value.value;
	}

	updateValue() {
		this.root.toggleItem(this.value);
	}

	get props() {
		return this.#attrs;
	}

	createTrigger(props: AccordionTriggerStateProps) {
		return new AccordionTriggerState(props, this);
	}

	createContent(props: AccordionContentStateProps) {
		return new AccordionContentState(props, this);
	}
}

/**
 * TRIGGER
 */

type AccordionTriggerStateProps = ReadonlyBoxedValues<{
	onclick: EventCallback<MouseEvent>;
	onkeydown: EventCallback<KeyboardEvent>;
	disabled: boolean;
	id: string;
}>;

class AccordionTriggerState {
	#disabled = undefined as unknown as ReadonlyBox<boolean>;
	#id = undefined as unknown as ReadonlyBox<string>;
	#root = undefined as unknown as AccordionState;
	#itemState = undefined as unknown as AccordionItemState;
	#onclickProp = boxedState<AccordionTriggerStateProps["onclick"]>(readonlyBox(() => () => {}));
	#onkeydownProp = boxedState<AccordionTriggerStateProps["onkeydown"]>(
		readonlyBox(() => () => {})
	);

	// Disabled if the trigger itself, the item it belongs to, or the root is disabled
	#isDisabled = $derived(
		this.#disabled.value || this.#itemState.disabled.value || this.#root.disabled.value
	);
	#attrs = $derived({
		id: this.#id.value,
		disabled: this.#isDisabled,
		"aria-expanded": getAriaExpanded(this.#itemState.isSelected),
		"aria-disabled": getAriaDisabled(this.#isDisabled),
		"data-disabled": getDataDisabled(this.#isDisabled),
		"data-value": this.#itemState.value,
		"data-state": getDataOpenClosed(this.#itemState.isSelected),
		"data-accordion-trigger": "",
	} as const);

	constructor(props: AccordionTriggerStateProps, itemState: AccordionItemState) {
		this.#disabled = props.disabled;
		this.#itemState = itemState;
		this.#root = itemState.root;
		this.#onclickProp.value = props.onclick;
		this.#onkeydownProp.value = props.onkeydown;
		this.#id = props.id;
	}

	#onclick = composeHandlers(this.#onclickProp, () => {
		if (this.#isDisabled) return;
		this.#itemState.updateValue();
	});

	#onkeydown = composeHandlers(this.#onkeydownProp, (e: KeyboardEvent) => {
		const handledKeys = [kbd.ARROW_DOWN, kbd.ARROW_UP, kbd.HOME, kbd.END, kbd.SPACE, kbd.ENTER];
		if (this.#isDisabled || !handledKeys.includes(e.key)) return;

		e.preventDefault();

		if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
			this.#itemState.updateValue();
			return;
		}

		if (!this.#root.id.value || !this.#id.value) return;

		const rootEl = document.getElementById(this.#root.id.value);
		if (!rootEl) return;
		const itemEl = document.getElementById(this.#id.value);
		if (!itemEl) return;

		const items = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-accordion-trigger]"));
		if (!items.length) return;

		const candidateItems = items.filter((item) => !item.dataset.disabled);
		if (!candidateItems.length) return;

		const currentIndex = candidateItems.indexOf(itemEl);

		const keyToIndex = {
			[kbd.ARROW_DOWN]: (currentIndex + 1) % candidateItems.length,
			[kbd.ARROW_UP]: (currentIndex - 1 + candidateItems.length) % candidateItems.length,
			[kbd.HOME]: 0,
			[kbd.END]: candidateItems.length - 1,
		};

		candidateItems[keyToIndex[e.key]!]?.focus();
	});

	get props() {
		return {
			...this.#attrs,
			onclick: this.#onclick,
			onkeydown: this.#onkeydown,
		};
	}
}

/**
 * CONTENT
 */

type AccordionContentStateProps = ReadonlyBoxedValues<{
	forceMount: boolean;
	id: string;
	style: StyleProperties;
}>;

class AccordionContentState {
	item = undefined as unknown as AccordionItemState;
	node = boxedState<HTMLElement | null>(null);
	#id = undefined as unknown as ReadonlyBox<string>;
	#originalStyles: { transitionDuration: string; animationName: string } | undefined = undefined;
	#isMountAnimationPrevented = false;
	#width = boxedState(0);
	#height = boxedState(0);
	#forceMount = undefined as unknown as ReadonlyBox<boolean>;
	present = $derived(this.#forceMount.value || this.item.isSelected);
	#styleProp = undefined as unknown as ReadonlyBox<StyleProperties>;
	#attrs = $derived({
		id: this.#id.value,
		"data-state": getDataOpenClosed(this.item.isSelected),
		"data-disabled": getDataDisabled(this.item.isDisabled),
		"data-value": this.item.value,
		"data-accordion-content": "",
		style: styleToString({
			...this.#styleProp.value,
			"--bits-accordion-content-height": `${this.#height.value}px`,
			"--bits-accordion-content-width": `${this.#width.value}px`,
		}),
	} as const);

	constructor(props: AccordionContentStateProps, item: AccordionItemState) {
		this.item = item;
		this.#forceMount = props.forceMount;
		this.#isMountAnimationPrevented = this.item.isSelected;
		this.#id = props.id;
		this.#styleProp = props.style;

		$effect.root(() => {
			tick().then(() => {
				this.node.value = document.getElementById(this.#id.value);
			});
		});

		$effect.pre(() => {
			const rAF = requestAnimationFrame(() => {
				this.#isMountAnimationPrevented = false;
			});

			return () => {
				cancelAnimationFrame(rAF);
			};
		});

		$effect(() => {
			// eslint-disable-next-line no-unused-expressions
			this.present;
			const node = this.node.value;
			if (!node) return;

			tick().then(() => {
				if (!this.node) return;
				// get the dimensions of the element
				this.#originalStyles = this.#originalStyles || {
					transitionDuration: node.style.transitionDuration,
					animationName: node.style.animationName,
				};

				// block any animations/transitions so the element renders at full dimensions
				node.style.transitionDuration = "0s";
				node.style.animationName = "none";

				const rect = node.getBoundingClientRect();
				this.#height.value = rect.height;
				this.#width.value = rect.width;

				// unblock any animations/transitions that were originally set if not the initial render
				if (!this.#isMountAnimationPrevented) {
					const { animationName, transitionDuration } = this.#originalStyles;
					node.style.transitionDuration = transitionDuration;
					node.style.animationName = animationName;
				}
			});
		});
	}

	get props() {
		return this.#attrs;
	}
}

/**
 * CONTEXT METHODS
 */

export const ACCORDION_ROOT_KEY = Symbol("Accordion.Root");
export const ACCORDION_ITEM_KEY = Symbol("Accordion.Item");

type AccordionState = AccordionSingleState | AccordionMultiState;

type InitAccordionProps = {
	type: "single" | "multiple";
	value: Box<string> | Box<string[]>;
	id: ReadonlyBox<string>;
	disabled: ReadonlyBox<boolean>;
};

export function setAccordionRootState(props: InitAccordionProps) {
	const { type, ...rest } = props;
	const rootState =
		type === "single"
			? new AccordionSingleState(rest as AccordionSingleStateProps)
			: new AccordionMultiState(rest as AccordionMultiStateProps);
	return setContext(ACCORDION_ROOT_KEY, rootState);
}

export function getAccordionRootState() {
	return getContext<AccordionState>(ACCORDION_ROOT_KEY);
}

export function setAccordionItemState(props: Omit<AccordionItemStateProps, "rootState">) {
	verifyContextDeps(ACCORDION_ROOT_KEY);
	const rootState = getAccordionRootState();
	const itemState = new AccordionItemState({ ...props, rootState });
	setContext(ACCORDION_ITEM_KEY, itemState);
	return itemState;
}

export function getAccordionItemState() {
	return getContext<AccordionItemState>(ACCORDION_ITEM_KEY);
}

export function getAccordionTriggerState(props: AccordionTriggerStateProps): AccordionTriggerState {
	verifyContextDeps(ACCORDION_ITEM_KEY);
	const itemState = getAccordionItemState();
	return itemState.createTrigger(props);
}

export function getAccordionContentState(props: AccordionContentStateProps): AccordionContentState {
	verifyContextDeps(ACCORDION_ITEM_KEY);
	const itemState = getAccordionItemState();
	return itemState.createContent(props);
}