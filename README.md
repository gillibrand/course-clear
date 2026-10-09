# Course Clear

A small web component that opens a dialog with a fun animation similar to that in Super Mario Maker.

<img src="https://raw.githubusercontent.com/gillibrand/course-clear/refs/heads/main/screenshot.png">

## Install

Install from NPM with:

`npm install course-clear`

## Usage

### From JavaScript

Set the `open` property (or toggle the `open` attribute) to open and close.

```js
import { CourseClear } from "course-clear";

const courseClear = new CourseClear();
document.body.appendChild(courseClear);
courseClear.greeting = "My Greeting!";
courseClear.innerHTML = "In the dialog.";
courseClear.open = true;
```

### From HTML

Importing `course-clear` into a module will automatically define it as a custom HTML element. This is a side-effect of the import. After that, use it like a normal element. Toggle the `open` attribute to open or close. Add `close-on-esc` to support closing with the escape key.

```html
<body>
  <course-clear greeting="My Greeting!" open close-on-esc> In the dialog. </course-clear>
</body>
```

## Attributes

| Attribute          | Property         | Description                                                                 |
| ------------------ | ---------------- | --------------------------------------------------------------------------- |
| `open`             | `open`           | Present to open the dialog. Remove to close it.                             |
| `greeting`         | `greeting`       | Short message animated in before the content. Defaults to "Course Clear!". |
| `close-on-esc`     | `closeOnEscape`  | Close when the Escape key is pressed.                                       |
| `close-on-outside` | `closeOnOutside` | Close when clicking outside the content, once the animation is done.       |

## Events

Both events bubble and are composed, so they can be handled on `document`.

- `opened`: fired once the open animation finishes.
- `closed`: fired once the dialog closes.

## Styling

Set these CSS custom properties on the element (or an ancestor) to change the colors:

- `--cc-custom-bg-color`: background of the curtains, bars, and content. Defaults to `#f3d41a`.
- `--cc-custom-color`: text color. Defaults to `#2c2b55`.
