---
title: mergeProps
description: A utility function to merge props objects.
---

The `mergeProps` function is a utility function that can be used to merge props objects. It takes in two or more props objects and returns a new merged props object, which is useful for composing multiple components with different props.

It is used internally by Bits UI components to merge the custom `restProps` you pass to a component with the props that Bits UI provides to the component.

## Event Handlers

`mergeProps` handles chaining of event handlers automatically in the order in which they are passed, and if a previous handler calls `event.preventDefault()`, the next handler in the chain will not be called.

```ts
import { mergeProps } from "bits-ui";

const props1 = { onclick: (event: MouseEvent) => console.log("1") };
const props2 = { onclick: (event: MouseEvent) => console.log("2") };

const mergedProps = mergeProps(props1, props2);

console.log(mergedProps.onclick(new MouseEvent("click"))); // 1 2
```

Since `props1` didn't call `event.preventDefault()`, `props2` will stll be called as normal.

```ts
import { mergeProps } from "bits-ui";

const props1 = { onclick: (event: MouseEvent) => console.log("1") };
const props2 = {
	onclick: (event: MouseEvent) => {
		console.log("2");
		event.preventDefault();
	},
};
const props3 = {
	onclick: (event: MouseEvent) => {
		console.log("3");
	},
};

const mergedProps = mergeProps(props1, props2, props3);

console.log(mergedProps.onclick(new MouseEvent("click"))); // 1 2
```

Since `props2` called `event.preventDefault()`, `props3`'s `onclick` handler will not be called.

## Non-Event Handler Functions

Functions that are't event handlers are also chained together, but one can't cancel out the other since there isn't an `event` object to cancel.

```ts
import { mergeProps } from "bits-ui";

const props1 = { doSomething: () => console.log("1") };
const props2 = { doSomething: () => console.log("2") };

const mergedProps = mergeProps(props1, props2);

console.log(mergedProps.onclick(new MouseEvent("click"))); // 1 2
```

## Classes

`mergeProps` also handles the merging of classes using `clsx`. This means that you can pass in multiple classes as an array or string, and they will be merged together.

```ts
import { mergeProps } from "bits-ui";

const props1 = { class: "orange blue yellow" };
const props2 = { class: "yellow blue green" };

const mergedProps = mergeProps(props1, props2);

console.log(mergedProps.class); // "orange blue yellow green"
```

## Styles

`mergeProps` also handles merging of style objects using `style-to-object`. You can pass in multiple style objects or style strings and they will be gracefully merged together in the order they are passed.

```ts
import { mergeProps } from "bits-ui";

const props1 = { style: { backgroundColor: "red" } };
const props2 = { style: "background-color: green" };

const mergedProps = mergeProps(props1, props2);

console.log(mergedProps.style); // "background-color: green;"
```

```ts
import { mergeProps } from "bits-ui";

const props1 = { style: "--foo: red" };
const props2 = { style: { "--foo": "green", color: "blue" } };

const mergedProps = mergeProps(props1, props2);

console.log(mergedProps.style); // "--foo: green; color: blue;"
```