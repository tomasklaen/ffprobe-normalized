import * as Path from 'path';
import {promises as FSP} from 'fs';
import * as CP from 'child_process';
import {promisify} from 'util';

export const exec = promisify(CP.exec);

export interface RawProbeData {
	streams: {
		index: number;
		codec_name: string; // 'h264'
		codec_long_name: string; // 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10'
		profile?: string; // 'High' (mp4, jpg)
		codec_type: string; // 'video'
		codec_tag_string: string; // 'avc1'
		codec_tag: string; // '0x31637661'
		width: number; // 1920
		height: number; // 1080
		coded_width: number; // 1920
		coded_height: number; // 1080
		closed_captions: number; // 0
		has_b_frames: number; // 2
		sample_aspect_ratio?: string; // '1:1' (jpg)
		display_aspect_ratio?: string; // '60:71' (jpg)
		pix_fmt: string; // 'yuv420p'
		level: number; // 42
		color_range?: string; // 'pc' (jpg, png)
		color_space?: string; // 'bt470bg' (jpg)
		chroma_location?: string; // 'left' (mp4, jpg)
		refs: number; // 1
		is_avc?: string; // 'true' (mp4)
		nal_length_size?: string; // '4' (mp4)
		r_frame_rate: string; // '25/1'
		avg_frame_rate: string; // '11250/449'
		time_base: string; // '1/90000'
		start_pts?: number; // 0 (mp4, jpg)
		start_time?: string; // '0.000000' (mp4, jpg)
		duration_ts?: number; // 1616400 (mp4, jpg)
		duration?: string; // '17.960000' (mp4, jpg)
		sample_fmt?: string; // 'fltp' (aac)
		sample_rate?: string; // '48000' (aac)
		channels?: number; // (aac)
		channel_layout?: string; // '5.1' (aac)
		bit_rate?: string; // '3759211' (mp4, jpg)
		bits_per_sample?: number; // (aac)
		bits_per_raw_sample?: string; // '8' (mp4, jpg)
		nb_frames?: string; // '450' (mp4)
		disposition: Disposition;
		// (mp4)
		tags?: {
			language: string; // 'und'
			title?: string; // 'The Second Dream'
			comment?: string; // 'The Second Dream'
			handler_name: string; // 'VideoHandler'
			vendor_id: string; // '[0][0][0][0]'
		};
	}[];
	format: {
		filename: string; // 'sky.mp4'
		nb_streams: number; // 1
		nb_programs: number; // 0
		format_name: string; // 'mov,mp4,m4a,3gp,3g2,mj2'
		format_long_name: string; // 'QuickTime / MOV'
		start_time?: string; // '0.000000' (mp4, jpg)
		duration: number; // milliseconds, normalized manually (mp4, jpg)
		size: number; // bytes, normalized manually
		bit_rate?: string; // '3762044' (mp4, jpg)
		probe_score: number; // 100
		// (mp4)
		tags?: {
			encoder: string; // 'Lavf58.22.100'
			album?: string; // 'Warframe'
			genre?: string; // 'Score'
			title?: string; // 'The Second Dream'
			artist?: string; // 'Keith Power And George Spanos'
			album_artist?: string; // 'Digital Extremes'
			track?: string; // '03'
			date: string; // '2017'
			major_brand?: string; // 'isom'
			minor_version?: string; // '512'
			compatible_brands?: string; // 'isomiso2avc1mp41'
		};
	};
}

// All numbers are 0 or 1
export interface Disposition {
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

export type ImageStream = {[key: string]: unknown} & {
	type: 'image';
	codec: string; // 'mjpeg', ...
	width: number;
	height: number;
	sar: number;
	dar: number;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
};

export type CoverStream = Omit<ImageStream, 'disposition'>;

export type VideoStream = {[key: string]: unknown} & {
	type: 'video';
	codec: string;
	width: number;
	height: number;
	framerate: number;
	sar: number;
	dar: number;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
};

export type AudioStream = {[key: string]: unknown} & {
	type: 'audio';
	codec: string;
	channels: number;
	language?: string;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
};

export type SubtitlesStream = {[key: string]: unknown} & {
	type: 'subtitles';
	codec: string;
	language?: string;
	title?: string;
	disposition: Disposition;
	tags?: {[key: string]: any};
};

export type Stream = ImageStream | VideoStream | AudioStream | SubtitlesStream;

export type ImageMeta = {[key: string]: unknown} & {
	path: string;
	type: 'image';
	size: number;
	codec: string;
	container: string;
	width: number;
	height: number;
	sar: number;
	dar: number;
};

export type AudioMeta = {[key: string]: unknown} & {
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
};

export type VideoMeta = {[key: string]: unknown} & {
	path: string;
	type: 'video';
	codec: string;
	container: string;
	duration: number;
	framerate: number;
	title?: string;
	size: number;
	width: number;
	height: number;
	sar: number;
	dar: number;
	streams: Stream[];
	videoStreams: VideoStream[];
	audioStreams: AudioStream[];
	subtitlesStreams: SubtitlesStream[];
};

export type Meta = ImageMeta | AudioMeta | VideoMeta;

/**
 * Get media file meta
 */
export async function ffprobe(
	filePath: string,
	{path: ffprobePath = process.env.FFPROBE_PATH || 'ffprobe'}: {path?: string} = {}
): Promise<Meta> {
	filePath = Path.resolve(filePath);
	let rawData: RawProbeData;
	let streams: Stream[];

	try {
		const stat = await FSP.stat(filePath);
		const {stdout, stderr} = await exec(
			[
				`"${ffprobePath}"`,
				'-hide_banner',
				'-v error',
				'-show_streams',
				'-show_format',
				'-print_format',
				'json',
				`"${filePath}"`,
			].join(' ')
		);

		if (stderr) throw new Error(stderr);

		rawData = JSON.parse(stdout) as RawProbeData;

		// Loose validity check
		if (!rawData || !Array.isArray(rawData.streams) || !rawData.format || typeof rawData.format !== 'object') {
			throw new Error(`Unsupported format. \n\nInvalid probe output: ${stdout}`);
		}

		// Normalize size
		rawData.format.size = stat.size;

		// Normalize duration
		rawData.format.duration = (parseFloat(`${rawData.format.duration || 0}`) || 0) * 1000;

		streams = normalizeStreams(rawData);
	} catch (error) {
		throw new Error(`Unsupported format. Probing, parsing, or normalizing probed data failed: ${eem(error)}`);
	}

	// We determine the type of file based on the types of streams it contains
	let firstVideoStream: VideoStream | undefined;
	let firstAudioStream: AudioStream | undefined;
	let firstImageStream: ImageStream | undefined;
	let firstSubtitleStream: SubtitlesStream | undefined;

	for (const stream of streams) {
		if (isVideoStream(stream) && !firstVideoStream) firstVideoStream = stream;
		if (isAudioStream(stream) && !firstAudioStream) firstAudioStream = stream;
		if (isImageStream(stream) && !firstImageStream) firstImageStream = stream;
		if (isSubtitlesStream(stream) && !firstSubtitleStream) firstSubtitleStream = stream;
	}

	const formatTags = lowercaseProps(removeNullProps(rawData.format.tags));

	// Video
	if (firstVideoStream) {
		const duration = rawData.format.duration;

		if (!duration || duration <= 0) {
			throw new Error(`Unsupported format. Invalid format duration: ${JSON.stringify(rawData, null, 2)}`);
		}

		return {
			...firstVideoStream.tags,
			...formatTags,
			path: filePath,
			type: 'video',
			codec: firstVideoStream.codec,
			container: rawData.format.format_name,
			duration,
			framerate: firstVideoStream.framerate,
			width: firstVideoStream.width,
			height: firstVideoStream.height,
			sar: firstVideoStream.sar,
			dar: firstVideoStream.dar,
			size: rawData.format.size,
			streams,
			videoStreams: streams.filter(isVideoStream),
			audioStreams: streams.filter(isAudioStream),
			subtitlesStreams: streams.filter(isSubtitlesStream),
		};
	}

	// Audio
	if (firstAudioStream) {
		const duration = rawData.format.duration;

		if (!duration || duration <= 0) {
			throw new Error(`Unsupported format. Invalid format duration: ${JSON.stringify(rawData, null, 2)}`);
		}

		const cover: CoverStream | undefined = firstImageStream ? {...firstImageStream} : undefined;
		// @ts-ignore Disposition is useless noise here.
		if (cover) delete cover.disposition;

		return {
			...firstAudioStream.tags,
			...formatTags,
			path: filePath,
			type: 'audio',
			size: rawData.format.size,
			codec: firstAudioStream.codec,
			container: rawData.format.format_name,
			duration,
			channels: firstAudioStream.channels,
			language: firstAudioStream.language,
			cover,
		};
	}

	// Image
	if (firstImageStream) {
		return {
			...firstImageStream.tags,
			...formatTags,
			path: filePath,
			type: 'image',
			size: rawData.format.size,
			codec: firstImageStream.codec,
			container: extractFileFormat(filePath), // format.format_name reports weird stuff like image2 for images
			width: firstImageStream.width,
			height: firstImageStream.height,
			sar: firstImageStream.sar,
			dar: firstImageStream.dar,
		};
	}

	throw new Error(`Unknown file, unable to categorize probe data: ${JSON.stringify(rawData, null, 2)}`);
}

/**
 * Normalizes streams.
 * - Determines wether source is image, audio, or video file.
 * - Normalizes durations to milliseconds.
 */
function normalizeStreams(rawData: RawProbeData): Stream[] {
	const rawStreams = rawData.streams;
	const seconds = rawData.format.duration / 1000;
	const streams: Stream[] = [];

	for (const rawStream of rawStreams) {
		const codec = normalizeCodecName(rawStream.codec_name);
		const tags: Record<string, unknown> = lowercaseProps(removeNullProps(rawStream.tags));
		const extractError = (what: string) =>
			new Error(
				`Couldn't extract ${what} out of ${rawStream.codec_type} stream: ${JSON.stringify(rawStream, null, 2)}`
			);

		// Normalize some tags
		if (tags) {
			if (tags.comments && !tags.comment) tags.comment = tags.comments;
		}

		switch (rawStream.codec_type) {
			case 'subtitle': {
				streams.push({
					type: 'subtitles',
					codec,
					disposition: rawStream.disposition,
					tags,
				});
				break;
			}

			case 'audio': {
				const channels = rawStream.channels;

				if (channels == null) throw extractError('channels');

				streams.push({
					type: 'audio',
					codec,
					channels,
					disposition: rawStream.disposition,
					tags,
				});
				break;
			}

			case 'video': {
				const [frNum, frDen] = (rawStream.r_frame_rate || '').split('/').map((part) => parseFloat(part));
				const disposition = rawStream.disposition;
				const framerate = frNum && frDen ? frNum / frDen : false;
				const width = rawStream.width;
				const height = rawStream.height;

				if (typeof framerate !== 'number' || !Number.isFinite(framerate) || framerate <= 0) {
					throw extractError('framerate');
				}
				if (!Number.isInteger(width) || width < 1) throw extractError('width');
				if (!Number.isInteger(height) || height < 1) throw extractError('height');

				const sar = parseAspectRatio(rawStream.sample_aspect_ratio) || 1;
				const dar = parseAspectRatio(rawStream.display_aspect_ratio) || (width / height) * 1;

				// Check if we are dealing with an image (single frame)
				// Checks if duration spans only 1 frame.
				// Or if the stream has a cover art disposition.
				if (
					!seconds ||
					Math.abs(seconds - 1 / framerate) < 0.02 ||
					disposition.attached_pic ||
					disposition.timed_thumbnails
				) {
					streams.push({
						type: 'image',
						codec,
						width,
						height,
						sar,
						dar,
						disposition: rawStream.disposition,
						tags,
					});
				} else {
					streams.push({
						type: 'video',
						codec,
						width,
						height,
						sar,
						dar,
						framerate,
						disposition: rawStream.disposition,
						tags,
					});
				}

				break;
			}
		}
	}

	return streams;
}

function normalizeCodecName(codecName: string) {
	const substitute = codecNameSubstitutes[codecName];
	return substitute ? substitute : codecName;
}

const codecNameSubstitutes: Record<string, string> = {
	mjpeg: 'jpeg',
};

function isVideoStream(value: Stream): value is VideoStream {
	return value.type === 'video';
}

function isImageStream(value: Stream): value is ImageStream {
	return value.type === 'image';
}

function isAudioStream(value: Stream): value is AudioStream {
	return value.type === 'audio';
}

function isSubtitlesStream(value: Stream): value is SubtitlesStream {
	return value.type === 'subtitles';
}

/**
 * `"2:1"` -> `2`
 * `"2/1"` -> `2`
 * `"2"` -> `2`
 */
function parseAspectRatio(value: unknown) {
	const groups = /^(?<numerator>\d+(\.\d+)?)((:|\/)(?<denominator>\d+(\.\d+)?))?$/.exec(`${value}`)?.groups;
	if (!groups) return null;
	const numerator = groups.numerator ? parseInt(groups.numerator, 10) : undefined;
	const denominator = groups.nominator ? parseInt(groups.nominator, 10) : undefined;
	if (numerator == null || !Number.isFinite(numerator)) return null;
	return denominator != null && Number.isFinite(denominator) ? numerator / denominator : numerator;
}

/**
 * Extract error message.
 */
function eem(error: any, preferStack = false) {
	return error instanceof Error ? (preferStack ? error.stack || error.message : error.message) : `${error}`;
}

/**
 * Lowercase properties on an object.
 */
function lowercaseProps<T extends Record<string, any>>(obj?: T): T {
	const result: Record<string, any> = {};

	if (obj) {
		for (const [prop, value] of Object.entries(obj)) {
			result[prop.toLowerCase()] = value;
		}
	}

	return result as T;
}

/**
 * Remove null/undefined properties from object.
 */
function removeNullProps<T extends Record<string, any>>(obj?: T): T {
	const result: Record<string, any> = {};

	if (obj) {
		for (const [prop, value] of Object.entries(obj)) {
			if (value != null) result[prop] = value;
		}
	}

	return result as T;
}

/**
 * Returns normalized container format of a file derived from its extension.
 *
 * For example, `jpeg` will return `jpg`
 */
function extractFileFormat(filename: string) {
	const ext = Path.extname(String(filename)).slice(1).toLowerCase();
	return extensionToFormat[ext] || ext;
}

const extensionToFormat: Record<string, string> = {
	jpeg: 'jpg',
	pjpeg: 'jpg',
};
