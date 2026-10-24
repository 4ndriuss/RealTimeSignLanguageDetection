"""Webcam capture on a background thread."""
import threading

import cv2


class LatestFrameCapture:
    """Reads the webcam continuously and keeps only the newest frame.

    `cv2.VideoCapture.read()` returns the oldest frame in the driver's buffer,
    so when processing is slower than the camera the display lags further and
    further behind. Reading on a separate thread and dropping stale frames
    keeps the latency at roughly one frame.
    """

    def __init__(self, index=0):
        self._cap = cv2.VideoCapture(index)
        self._cond = threading.Condition()
        self._frame = None
        self._frame_id = 0
        self._last_read_id = 0
        self._running = self._cap.isOpened()
        self._thread = threading.Thread(target=self._reader, daemon=True)
        self._thread.start()

    def is_opened(self):
        return self._running

    def _reader(self):
        while self._running:
            ok, frame = self._cap.read()
            with self._cond:
                if ok:
                    self._frame = frame
                    self._frame_id += 1
                else:
                    self._running = False
                self._cond.notify_all()

    def read(self, timeout=2.0):
        """Return the newest frame not returned before, or None if the camera stopped."""
        with self._cond:
            self._cond.wait_for(
                lambda: self._frame_id != self._last_read_id or not self._running, timeout)
            if self._frame_id == self._last_read_id:
                return None
            self._last_read_id = self._frame_id
            return self._frame

    def release(self):
        self._running = False
        self._thread.join(timeout=1.0)
        self._cap.release()
