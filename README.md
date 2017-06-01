# The Unofficial Asana Chrome Plugin

This is a free, open-source Chrome extension to allow quick and easy access 
to Asana. This extension uses Asana API to communicate to Asana.

This extension is based on Asana's - Official Chrome Extension available here:
[Chromestore](https://chrome.google.com/webstore/detail/asana-extension-for-chrom/khnpeclbnipcdacdkhejifenadikeghk)
and [Github source](https://github.com/Asana/Chrome-Extension-Example)


## License
MIT

## Motivation
Asana's Official Chrome Extension hasn't seen any new features in years.
But they have kept their plugin under MIT license and Asana offers rich set 
of REST API. Onus is on us to develop something great out of it.


## Features

1. Create Task
    - provide task name and description
    - under a workspace/project
    - assign to a user
    - apply tag(s) to task
    - set due date

2. View Task (Todo)
    - view my tasks
    - view my tasks by due date
    - view my tasks for today
    - view tasks in a workspace/project
    - view tasks assigned to another user
    - mark tasks as done

3. Other Utilities on Asana task pages
    - set alarm on my tasks with due time
    - navigate subtasks
    - replace patterns in task description (notes)

## Usage
### Install as a User:
Head to [Chrome Web Store](https://chrome.google.com/webstore/detail/asanang-asana-extension-f/mcfgjehdbegcfjeecdgdpjlmfbeamgdd) and click "+ADD TO CHROME"

### Install as a developer:
  1. Download the code, e.g. `git clone git@github.com:amitg87/asana-chrome-plugin.git`
  2. Navigate chrome to `chrome://extensions`
  3. Check the `Developer mode` toggle
  4. Click on `Load Unpacked Extension...`
  5. Select the folder containing the extension

## User Guide
Long Way - Look for Asana in Chrome Browser Action (top-right corner),
 when clicked, pops up a window.

Short-cut key - press 'Alt + A' keyboard shortcut