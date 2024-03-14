## DigitalOcean Space CDN API issue

The code reproduces the issue with [Purge API](https://docs.digitalocean.com/reference/api/api-try-it-now/#/CDN%20Endpoints/cdn_purge_cache). The DO CDN ignores purging if a file was requested with a header 'origin'. The header always exists in browser requests. It means if CDN was configured with TTL 1 week and there is an office with 1000 people (the same external IP) and one of them requested a script from DO Spaces CDN and the script was changed after that and purged via API other 999 people will get old file during 1 week.

## Logic
- create and upload a file with some content (filename is always new to avoid old values)
- check via 3 requests (DO Spaces, DO Spaces + CDN, DO Spaces + CDN + headers) that the content is returned
- generate new content and upload it to the same file
- check that CDN returns old values. It's expected
- purge CDN via API
- reproduce that the request CDN + headers still returns the old value

## Usage

* Install aws-sdk
```sh
npm install
```
* Set valid values in private.js for your Space + CDN
```js
export default {
    cdn_id: '[SET_YOUR_VALUE]',
    token: '[SET_YOUR_VALUE]',
    do_spaces: {
        accessKeyId: '[SET_YOUR_VALUE]',
        Bucket: '[SET_YOUR_VALUE]',
        endpoint: '[SET_YOUR_VALUE]',
        region: '[SET_YOUR_VALUE]',
        secretAccessKey: '[SET_YOUR_VALUE]',
    }
}
```
* Run `main.js` to reproduce the issue:
```
node main.js
```
## STDOUT Example
```
- 2024-03-14 21:15:00 generate content: "324N"
- 2024-03-14 21:15:00 upload the content to DO Spaces

- 2024-03-14 21:15:00 sleep 2 sec

- 2024-03-14 21:15:02 CHECKING FILES:
- 2024-03-14 21:15:02 fetch uploaded content from origin endpoint
- 2024-03-14 21:15:02 "324N" (expected) == "324N" (DO Spaces): TRUE
- 2024-03-14 21:15:02 fetch uploaded content from CDN endpoint (without header "origin")
- 2024-03-14 21:15:03 "324N" (expected) == "324N" (DO Spaces CDN): TRUE
- 2024-03-14 21:15:03 fetch uploaded content from CDN endpoint (with Header "origin")
- 2024-03-14 21:15:03 "324N" (expected) == "324N" (DO Spaces CDN): TRUE

- 2024-03-14 21:15:03 sleep 2 sec

- 2024-03-14 21:15:05 CHECKING FILES:
- 2024-03-14 21:15:05 fetch uploaded content from origin endpoint
- 2024-03-14 21:15:05 "34PV" (expected) == "34PV" (DO Spaces): TRUE
- 2024-03-14 21:15:05 fetch uploaded content from CDN endpoint (without header "origin")
- 2024-03-14 21:15:05 "34PV" (expected) == "324N" (DO Spaces CDN): FALSE
- 2024-03-14 21:15:05 fetch uploaded content from CDN endpoint (with Header "origin")
- 2024-03-14 21:15:05 "34PV" (expected) == "324N" (DO Spaces CDN): FALSE
- 2024-03-14 21:15:05 purge DO Spaces via API
- 2024-03-14 21:15:07 purge status code: 204

- 2024-03-14 21:15:07 CHECKING FILES:
- 2024-03-14 21:15:07 fetch uploaded content from origin endpoint
- 2024-03-14 21:15:07 "34PV" (expected) == "34PV" (DO Spaces): TRUE
- 2024-03-14 21:15:07 fetch uploaded content from CDN endpoint (without header "origin")
- 2024-03-14 21:15:07 "34PV" (expected) == "34PV" (DO Spaces CDN): TRUE
- 2024-03-14 21:15:07 fetch uploaded content from CDN endpoint (with Header "origin")
- 2024-03-14 21:15:07 "34PV" (expected) == "324N" (DO Spaces CDN): FALSE
^^^^^^^^^^^^^^^^^^^^^^^^^^^ (EXPECTED: TRUE) ^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

The last content comparing must return TRUE.

## Timelog
* The bug appeared after DigitalOcean updated CDN (autumn 2023).
* January 2024: opened ticket. The issue was reproduced for different Spaces/CDN. Requests were made from DO VPS in the same region.
* March 2024: still no result. Endless attempts from DigitalOcean automatically to close the ticket and answers: that the issue isn't reproducible.
