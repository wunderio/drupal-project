# Changes proposed in this PR:

[Explain what was done and why. You can also add screenshots here if it helps.]

# How to test

## Testing in feature environment:

[Add link to feature environment]
https://[BRANCH-NAME].[PROJECT-NAME].dev.wdr.io/

[Add command how to get admin login url to the feature environment]
`ssh www-admin@[BRANCH-name]-shell.[PROJECT-NAME] -J www-admin@ssh.dev.wdr.io "drush uli"`

## Local testing

_Detail custom setup instructions if any - any drush commands, content reindexing, specific user to use, etc._

    git fetch && git checkout <branch>
    lando composer install
    lando drush cim -y
    lando drush cr

## Testing steps

_Testing scenario goes here._

1. Do this.
2. Go there.
3. Validate that xyz is working.

# Best practices:

<details>
<summary><h3>Accessibility:</h3></summary>
<p>
This project must support WCAG accessibility level AA <em>(edit this according to the requirements of your project)</em>. To ensure this standard is met, remember to:

- Perform automated checks using a tool such as Wave or SiteImprove.
- Test keyboard navigation: are all parts of the UI navigable using only the keyboard? Is the tab order logical? Can popups, menus etc be dismissed with the escape key?
- Test responsiveness, scaling and text reflow.
- Make sure no accessibility issues exist on either desktop or mobile views.
- If you have time, test with a screen reader such as VoiceOver (macOS), NVDA (Windows), or Orca (Linux).

Use the [Accessibility Testing Cheat Sheet](https://intra.wunder.io/info/accessibility-group/accessibility-testing-cheat-sheet) for information on how to run these tests.

</p>
</details>
