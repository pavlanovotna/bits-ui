import type {
	DialogClosePropsWithoutHTML,
	DialogContentPropsWithoutHTML,
	DialogDescriptionPropsWithoutHTML,
	DialogOverlayPropsWithoutHTML,
	DialogPortalPropsWithoutHTML,
	DialogRootPropsWithoutHTML,
	DialogTitlePropsWithoutHTML,
	DialogTriggerPropsWithoutHTML,
} from "bits-ui";
import {
	childrenSnippet,
	createApiSchema,
	createBooleanProp,
	createEnumProp,
	createFunctionProp,
	createUnionProp,
	dismissableLayerProps,
	escapeLayerProps,
	focusScopeProps,
	forceMountProp,
	portalProps,
	preventOverflowTextSelectionProp,
	preventScrollProp,
	union,
	withChildProps,
} from "./helpers.js";
import { enums } from "$lib/content/api-reference/helpers.js";
import * as C from "$lib/content/constants.js";

export const root = createApiSchema<DialogRootPropsWithoutHTML>({
	title: "Root",
	description: "The root component used to set and manage the state of the dialog.",
	props: {
		open: createBooleanProp({
			default: C.FALSE,
			description: "Whether or not the dialog is open.",
			bindable: true,
		}),
		onOpenChange: createFunctionProp({
			definition: "(open: boolean) => void",
			description: "A callback function called when the open state changes.",
		}),
		children: childrenSnippet(),
	},
});

export const close = createApiSchema<DialogClosePropsWithoutHTML>({
	title: "Close",
	description: "A button used to close the dialog.",
	props: withChildProps({ elType: "HTMLButtonElement" }),
	dataAttributes: [
		{
			name: "dialog-close",
			description: "Present on the close button.",
		},
	],
});

export const content = createApiSchema<DialogContentPropsWithoutHTML>({
	title: "Content",
	description: "The content displayed within the dialog modal.",
	props: {
		...escapeLayerProps,
		...dismissableLayerProps,
		...focusScopeProps,
		forceMount: forceMountProp,
		preventOverflowTextSelection: preventOverflowTextSelectionProp,
		preventScroll: preventScrollProp,
		...withChildProps({ elType: "HTMLDivElement" }),
	},
	dataAttributes: [
		{
			name: "state",
			value: enums("open", "closed"),
			description: "The state of the dialog.",
			isEnum: true,
		},
		{
			name: "dialog-content",
			description: "Present on the content.",
		},
	],
});

export const title = createApiSchema<DialogTitlePropsWithoutHTML>({
	title: "Title",
	description: "An accessibile title for the dialog.",
	props: {
		level: createUnionProp({
			options: ["1", "2", "3", "4", "5", "6"],
			description: "The heading level of the title.",
			default: "3",
		}),
		...withChildProps({ elType: "HTMLDivElement" }),
	},
	dataAttributes: [
		{
			name: "dialog-title",
			description: "Present on the title.",
		},
	],
});

export const description = createApiSchema<DialogDescriptionPropsWithoutHTML>({
	title: "Description",
	description: "An accessibile description for the dialog.",
	props: withChildProps({ elType: "HTMLDivElement" }),
	dataAttributes: [
		{
			name: "dialog-description",
			description: "Present on the description.",
		},
	],
});

export const trigger = createApiSchema<DialogTriggerPropsWithoutHTML>({
	title: "Trigger",
	description: "The element which opens the dialog on press.",
	props: withChildProps({ elType: "HTMLButtonElement" }),
	dataAttributes: [
		{
			name: "dialog-trigger",
			description: "Present on the trigger.",
		},
	],
});

export const overlay = createApiSchema<DialogOverlayPropsWithoutHTML>({
	title: "Overlay",
	description: "An overlay which covers the body when the dialog is open.",
	props: {
		forceMount: forceMountProp,
		...withChildProps({ elType: "HTMLDivElement" }),
	},
	dataAttributes: [
		{
			name: "state",
			value: enums("open", "closed"),
			description: "The state of the dialog.",
			isEnum: true,
		},
		{
			name: "dialog-overlay",
			description: "Present on the overlay.",
		},
	],
});

export const portal = createApiSchema<DialogPortalPropsWithoutHTML>({
	title: "Portal",
	description: "A portal which renders the dialog into the body when it is open.",
	props: portalProps,
});

export const dialog = [root, trigger, content, overlay, portal, close, title, description];
