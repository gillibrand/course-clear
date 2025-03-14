# Course Clear

A small web component that opens a dialog with a fun animation similar to that in Super Mario Maker.

<img src="https://raw.githubusercontent.com/gillibrand/course-clear/refs/heads/main/screenshot.png">

## Install

Install from NPM with:

`npm install course-clear`

## Usage

### From JavaScript

Use the `.open` setter (or the attribute's) presence to open and close.

```js
import { CourseClear } from "course-clear";

const courseClear = new CourseClear();
document.body.appendChild(courseClear);
courseClear.greeting = "My Greeting!";
courseClear.innerHTML = "In the dialog.";
courseClear.open = "My Greeting!";
```

### From HTML

Importing `course-clear` into a module will automatically define it as a custom HTML element. This is a side-effect of the import. After that, use it like a normal element. Toggle the `open` attribute to open or close. Add `close-on-esc` to support closing with the escape key.

```html
<body>
  <course-clear greeting="My Greeting!" open close-on-esc> In the dialog. </course-clear>
</body>
```
