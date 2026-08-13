export const editBlockState = $state<{ capturedElement: HTMLElement | null }>({
  capturedElement: null,
});

export function capturePointer(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement;

  editBlockState.capturedElement = element;

  element.setPointerCapture(event.pointerId);
}
