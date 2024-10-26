# ffprobe-normalized

Retrieves and normalizes ffprobe output.

Features:

-   Output interfaces that make it easy to differentiate between image, audio, and video files.
-   Nicely structured and categorized streams.
-   Normalized all times into milliseconds.
-   GIFs with only 1 frame are marked as image, while GIFs with more than 1 frame as video.

## Install

```
npm install ffprobe-normalized
```

## Usage

```ts
import {ffprobe} from 'ffprobe-normalized';

const meta = await ffprobe('fixtures/audio.mp3');
console.log(meta.duration); // 3000
console.log(meta.artist); // Artist name
```

## API

```ts
async function ffprobe(path: string, options: {path?: string}): Promise<Meta>;
```

Retrieves media file meta data. See below for interfaces.

### Options

#### `path`

Type: `string`
Default: `process.env.FFPROBE_PATH || 'ffprobe'`

Path to ffprobe binary.

### Meta

```ts
type Meta = ImageMeta | AudioMeta | VideoMeta;
```

#### ImageMeta

```ts
interface ImageMeta {
	path: string;
	type: 'image';
	size: number;
	codec: string;
	container: string;
	/** Raw width of image data. */
	width: number;
	/** Raw height of image data. */
	height: number;
	/** Sample aspect ratio. */
	sar: number;
	/** Display aspect ratio. */
	dar: number;
	/** Width as it'll be rendered by players respecting sar. */
	displayWidth: number;
	/** Height as it'll be rendered by players respecting sar. */
	displayHeight: number;
	pixelFormat: string;
	rawProbeData: RawProbeData; // See source for common props
}
```

#### AudioMeta

```ts
interface AudioMeta {
	path: string;
	type: 'audio';
	size: number;
	codec: string;
	container: string;
	channels: number;
	duration: number;
	cover?: CoverStream;
	album?: string;
	genre?: string;
	language?: string;
	title?: string;
	artist?: string;
	album_artist?: string;
	track?: string;
	rawProbeData: RawProbeData;
}
```

#### VideoMeta

```ts
interface VideoMeta {
	path: string;
	type: 'video';
	codec: string;
	container: string;
	duration: number;
	framerate: number;
	title?: string;
	size: number;
	/** Raw width of image data. */
	width: number;
	/** Raw height of image data. */
	height: number;
	/** Sample aspect ratio. */
	sar: number;
	/** Display aspect ratio. */
	dar: number;
	/** Width as it'll be rendered by players respecting sar. */
	displayWidth: number;
	/** Height as it'll be rendered by players respecting sar. */
	displayHeight: number;
	streams: Stream[];
	videoStreams: VideoStream[];
	audioStreams: AudioStream[];
	subtitlesStreams: SubtitlesStream[];
	rawProbeData: RawProbeData;
}
```

#### Streams

```ts
// All numbers are 0 or 1
interface Disposition {
	default: number;
	dub: number;
	original: number;
	comment: number;
	lyrics: number;
	karaoke: number;
	forced: number;
	hearing_impaired: number;
	visual_impaired: number;
	clean_effects: number;
	attached_pic: number;
	timed_thumbnails: number;
}

interface ImageStream {
	type: 'image';
	codec: string; // 'mjpeg', ...
	/** Raw width of image data. */
	width: number;
	/** Raw height of image data. */
	height: number;
	/** Sample aspect ratio. */
	sar: number;
	/** Display aspect ratio. */
	dar: number;
	/** Width as it'll be rendered by players respecting sar. */
	displayWidth: number;
	/** Height as it'll be rendered by players respecting sar. */
	displayHeight: number;
	title?: string;
	disposition: Disposition;
	pixelFormat: string;
	tags?: {[key: string]: any};
}

type CoverStream = Omit<ImageStream, 'disposition'>;

interface VideoStream {
	type: 'video';
	codec: string;
	/** Raw width of image data. */
	width: number;
	/** Raw height of image data. */
	height: number;
	/** Sample aspect ratio. */
	sar: number;
	/** Display aspect ratio. */
	dar: number;
	/** Width as it'll be rendered by players respecting sar. */
	displayWidth: number;
	/** Height as it'll be rendered by players respecting sar. */
	displayHeight: number;
	framerate: number;
	title?: string;
	disposition: Disposition;
	pixelFormat: string;
	tags?: {[key: string]: any};
}

interface AudioStream {
	type: 'audio';
	codec: string;
	channels: number;
	language?: string;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
}

interface SubtitlesStream {
	type: 'subtitles';
	codec: string;
	language?: string;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
	[key: string]: unknown; // other raw metadata
}

type Stream = ImageStream | VideoStream | AudioStream | SubtitlesStream;
```
