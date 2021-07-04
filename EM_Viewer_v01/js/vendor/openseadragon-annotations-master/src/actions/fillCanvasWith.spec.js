import test from 'ava';
import { ACTIVITY_UPDATE, ANNOTATIONS_RESET } from '../constants/actionTypes';
import fillCanvasWith from './fillCanvasWith';
import { generateAnnotations, fakeFactory } from '../utils/test';

test('should abort any ongoing activity', t => {
  const Dispatcher = fakeFactory.getDispatcher();
  const fakeData = generateAnnotations();
  fillCanvasWith(fakeData, Dispatcher);
  t.true(Dispatcher.dispatch.firstCall.calledWith({
    type: ACTIVITY_UPDATE,
    inProgress: false,
  }));
});

test('then it should set the annotations with the value passed', t => {
  const Dispatcher = fakeFactory.getDispatcher();
  const fakeData = generateAnnotations();
  fillCanvasWith(fakeData, Dispatcher);
  t.true(Dispatcher.dispatch.secondCall.calledWith({
    type: ANNOTATIONS_RESET,
    annotations: fakeData,
  }));
});
