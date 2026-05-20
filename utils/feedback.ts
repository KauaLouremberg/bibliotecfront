import { Toast } from 'toastify-react-native';

type ToastKind = 'success' | 'error' | 'warn' | 'info';

function showToast(type: ToastKind, title: string, message?: string) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: type === 'error' ? 5000 : 3500,
    autoHide: true,
    useModal: false,
  });
}

export function showSuccessToast(title: string, message?: string) {
  showToast('success', title, message);
}

export function showErrorToast(title: string, message?: string) {
  showToast('error', title, message);
}

export function showWarningToast(title: string, message?: string) {
  showToast('warn', title, message);
}

export function showInfoToast(title: string, message?: string) {
  showToast('info', title, message);
}
