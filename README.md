# Hackerspace widget

Shows real time information about the hackerspace. Created for
[Hacklab Jyväskylä](https://jkl.hacklab.fi/).

This uses proposed
[MSC2762](https://github.com/matrix-org/matrix-spec-proposals/blob/travis/msc/widgets-send-receive-events/proposals/2762-widget-event-receiving.md)
extension of Matrix widget API. The proposed API has prefixes of
`org.matrix.msc2762` and `org.matrix.msc2876` which weren't obvious,
but again, with trial and error with help of
[#matrix-widgets:matrix.org](https://matrix.to/#/#matrix-widgets:matrix.org)
I was able to stitch a working version.

In case it's not used as Matrix widget or user doesn't give
permissions to the widget, it uses HTTP API as fallback. In that case
the page shows *Data source: REST API* and updates every 60 seconds.

## How to use

Add the widget to your Matrix room (`im.vector.modular.widgets` state event).

Alter room permissions and set desired power levels for sending events
`fi.hacklab.venue` and `fi.hacklab.visitors`. Otherwise anyone can
spam them.

Deploy a matrix bot which provides the event data to the room. We are
using [Visitors project](https://github.com/HacklabJKL/visitors/).

## Technical info

The data is provided by two separate events which come from different sources.

### fi.hacklab.venue

Contains information about the premises. The person in charge (last
one who has opened the door) and the state of doors (locked or
unlocked). Example event content:

```json
{
    "inCharge": "Jonna",
    "isOpen": false,
    "version": 1
}
```

If `inCharge` is null, then the place is closed. If `isOpen` is true,
the doors are unlocked.

### fi.hacklab.visitors

Contains list of nicknames who are present. Empty list, if no one is
registered. Example event content:

```json
{
    "nicks": [
        "Jani",
        "Petteri"
    ],
    "version": 1
}
```

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
