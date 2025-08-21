// import { renderHook, act } from '@testing-library/react-hooks';
// // import { RecordingRepository } from '../src/database/repositories/RecordingRepository';
// import {  useRecordingActions } from '../src/hooks/useRecordings';

// // Mock WatermelonDB
// jest.mock('../src/database/DatabaseProvider', () => ({
//   useDatabase: () => ({
//     write: jest.fn().mockImplementation(async fn => {
//       return await fn();
//     }),
//     get: jest.fn().mockReturnValue({
//       create: jest.fn().mockResolvedValue({
//         id: 'test-id',
//         title: 'Test Recording',
//         duration: 120,
//         playCount: 0,
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       }),
//       find: jest.fn().mockResolvedValue({
//         id: 'test-id',
//         title: 'Test Recording',
//         duration: 120,
//         playCount: 0,
//         update: jest.fn().mockResolvedValue(undefined),
//         markAsDeleted: jest.fn().mockResolvedValue(undefined),
//       }),
//       query: jest.fn().mockReturnValue({
//         fetch: jest.fn().mockResolvedValue([]),
//         fetchCount: jest.fn().mockResolvedValue(0),
//         observe: jest.fn().mockReturnValue({
//           subscribe: jest.fn().mockImplementation(callback => {
//             callback([]);
//             return { unsubscribe: jest.fn() };
//           }),
//         }),
//         observeCount: jest.fn().mockReturnValue({
//           subscribe: jest.fn().mockImplementation(callback => {
//             callback(0);
//             return { unsubscribe: jest.fn() };
//           }),
//         }),
//       }),
//     }),
//   }),
// }));

// describe('useRecordings', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test('should provide recording actions', async () => {
//     const { result } = renderHook(() => useRecordingActions());

//     expect(result.current).toHaveProperty('createRecording');
//     expect(result.current).toHaveProperty('updateRecording');
//     expect(result.current).toHaveProperty('deleteRecording');
//     expect(result.current).toHaveProperty('incrementPlayCount');
//   });

//   test('should create a recording', async () => {
//     const { result } = renderHook(() => useRecordingActions());

//     const recordingData = {
//       title: 'Test Recording',
//       url: '/path/to/recording.m4a',
//       duration: 120,
//     };

//     await act(async () => {
//       const response = await result.current.createRecording(recordingData);
//       expect(response.success).toBe(true);
//     });
//   });

//   test('should delete a recording', async () => {
//     const { result } = renderHook(() => useRecordingActions());

//     await act(async () => {
//       const response = await result.current.deleteRecording('test-id');
//       expect(response.success).toBe(true);
//     });
//   });
// });
