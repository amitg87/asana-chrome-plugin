# The Unofficial Asana Chrome Plugin

This is a free, open-source Chrome extension to allow quick and easy access 
to Asana. This extension uses Asana API to communicate with Asana.

This extension is based on Asana's - Official Chrome Extension available here:
[Chromestore](https://chrome.google.com/webstore/detail/asana-extension-for-chrom/khnpeclbnipcdacdkhejifenadikeghk)
and [Github source](https://github.com/Asana/Chrome-Extension-Example)


## License
MIT

## Motivation
Asana's Official Chrome Extension hasn't seen any new features in years.

Asana offers rich set of REST API. Onus is on us to develop something great out of it.


## Features

1. Create Task
    - provide task name and description
    - under a workspace/project
    - assign to a user
    - apply tag(s) to task
    - set due date

2. View Task
    - view my tasks
    - view tasks in a workspace/project
    - view tasks assigned to another user
    - task manipulations - edit tasks title, description, followers, tags, comments, etc

3. Search Task, Section, Project, Tag
    - omnibox search with 'asana'
    - search by text - clicking on the search result will open respective page in Asana.
    
## Usage
### Install as a User:
Head to [Chrome Web Store](https://chrome.google.com/webstore/detail/asanang-asana-extension-f/mcfgjehdbegcfjeecdgdpjlmfbeamgdd) and click "+ADD TO CHROME"

### Install as a developer:
  1. Download the code, e.g. `git clone git@github.com:amitg87/asana-chrome-plugin.git`
  2. Navigate Chrome to `chrome://extensions`
  3. Check the `Developer mode` toggle
  4. Click on `Load unpacked extension...`
  5. Select the folder containing the extension

## User Guide
Long Way - Look for Asana in Chrome Browser Action (top-right corner),
 when clicked, a window pops up.
 
Short-cut key - press 'Alt + A' keyboard shortcut