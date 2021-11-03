import test from 'ava';
import * as Path from 'path';
import {ffprobe} from './src';

const pluck = (keys: any[], target: Record<any, any>) =>
	keys.reduce((result, key) => {
		result[key] = target[key];
		return result;
	}, {});

test('probes image files', async (t) => {
	const path = Path.join(process.cwd(), 'fixtures', 'image.jpg');
	const meta = await ffprobe(path);
	const expectedMeta = {
		type: 'image',
		path: path,
		codec: 'jpeg',
		container: 'jpg',
		width: 800,
		height: 450,
	};
	t.deepEqual(pluck(Object.keys(expectedMeta), meta), expectedMeta);
});

test('probes audio files (mp3)', async (t) => {
	const path = Path.join(process.cwd(), 'fixtures', 'audio.mp3');
	const meta = await ffprobe(path);
	const expectedMeta = {
		type: 'audio',
		path: path,
		codec: 'mp3',
		container: 'mp3',
		channels: 2,
		duration: 9064.49,
		size: 205876,
		date: '2000',
		title: 'test title',
		artist: 'test artist',
		comment: 'test comment',
		genre: 'Classical',
		track: '2',
	};
	t.deepEqual(pluck(Object.keys(expectedMeta), meta), expectedMeta);
});

test('probes audio files (ogg)', async (t) => {
	const path = Path.join(process.cwd(), 'fixtures', 'audio.ogg');
	const meta = await ffprobe(path);
	const expectedMeta = {
		type: 'audio',
		path: path,
		codec: 'vorbis',
		container: 'ogg',
		channels: 2,
		duration: 9033.401,
		size: 152846,
		date: '2000',
		title: 'test title',
		artist: 'test artist',
		comment: 'test comment',
		genre: 'Classical',
		track: '2',
	};
	t.deepEqual(pluck(Object.keys(expectedMeta), meta), expectedMeta);
});

test('probes video files', async (t) => {
	const path = Path.join(process.cwd(), 'fixtures', 'video.webm');
	const meta = await ffprobe(path);
	const expectedMeta = {
		type: 'video',
		path: path,
		codec: 'vp8',
		container: 'matroska,webm',
		duration: 10875,
		width: 640,
		height: 360,
		title: 'test title',
	};
	t.deepEqual(pluck(Object.keys(expectedMeta), meta), expectedMeta);
});
