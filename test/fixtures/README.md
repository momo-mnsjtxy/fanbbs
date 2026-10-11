# Synthetic private-media fixtures

Both fixtures were generated locally from a solid lavender color. They contain
no user content or third-party media. They are used only by the isolated live
API contract test; they are not UI screenshots.

- `private-image.png`: 32 × 32 RGB PNG
- `private-video.mp4`: one-second 32 × 32 H.264/yuv420p MP4, one frame, no audio

Generation with the already-installed FFmpeg:

```sh
ffmpeg -f lavfi -i 'color=c=lavender:s=32x32' -frames:v 1 -threads 1 private-image.png
ffmpeg -f lavfi -i 'color=c=lavender:s=32x32:r=1' -t 1 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart private-video.mp4
```

FFprobe confirmed both codecs/dimensions and the video duration. Live tests
verify owner-authorized bytes and MIME types against these exact files, plus
anonymous/foreign 404 masking. Actual browser decoding/playback has not been
verified in this executor.
