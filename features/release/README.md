# UnderWeb X releases

`RELEASE_VERSION` is the single release-version source for the Windows distribution pipeline.

Bump `RELEASE_VERSION` when a validated main-branch build should become a new permanent GitHub Release. The release workflow publishes the installer, portable ZIP, and `SHA256SUMS.txt` from that exact successful build. Existing release tags are never overwritten.
