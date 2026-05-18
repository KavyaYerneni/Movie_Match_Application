import { SWIPE_STYLE } from '../config/swipeStyle.js';
import * as classic from './cardMotion.classic.js';
import * as tinder from './cardMotion.tinder.js';

const engine = SWIPE_STYLE === 'tinder' ? tinder : classic;

export const FLY_OFF_MS = engine.FLY_OFF_MS;
export const SWIPE_THRESHOLD = engine.SWIPE_THRESHOLD;

export const getDragTransform = engine.getDragTransform;
export const getStackProgress = engine.getStackProgress ?? (() => 0);
export const toTransform = engine.toTransform;
export const animateArcFlyOff = engine.animateArcFlyOff;
export const getFlyStartTransform = engine.getFlyStartTransform;
export const animateSpringBack = engine.animateSpringBack;
