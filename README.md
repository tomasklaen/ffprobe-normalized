# ffprobe-normalized

Retrieves and normalizes ffprobe output.

Features:

- Output interfaces that make it easy to differentiate between image, audio, and video files.
- Nicely structured and categorized streams.
- Normalized all times into milliseconds.
- GIFs with only 1 frame are marked as image, while GIFs with more than 1 frame as video.

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
	width: number;
	height: number;
	[key: string]: any; // other metadata
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
	[key: string]: any; // other metadata
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
	size: number; // bytes
	width: number; // width of the first video stream, 0 if no video streams
	height: number; // height of the first video stream, 0 if no video streams
	streams: Stream[];
	audioStreams: AudioStream[];
	subtitlesStreams: SubtitlesStream[];
	[key: string]: any; // other metadata
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
	width: number;
	height: number;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
}

type CoverStream = Omit<ImageStream, 'disposition'>;

interface VideoStream {
	type: 'video';
	codec: string;
	width: number;
	height: number;
	framerate: number;
	title?: string;
	disposition: Disposition;
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
}

type Stream = ImageStream | VideoStream | AudioStream | SubtitlesStream;
```
