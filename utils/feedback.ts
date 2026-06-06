import { Toast } from 'toastify-react-native';

type ToastKind = 'success' | 'error' | 'warn' | 'info';

const toastTheme: Record<
  ToastKind,
  {
    backgroundColor: string;
    closeIconColor: string;
    iconColor: string;
    progressBarColor: string;
    textColor: string;
  }
> = {
  success: {
    backgroundColor: '#31452F',
    closeIconColor: '#F5ECD7',
    iconColor: '#D9E7C1',
    progressBarColor: '#D9E7C1',
    textColor: '#F5ECD7',
  },
  error: {
    backgroundColor: '#5A251F',
    closeIconColor: '#FFF7ED',
    iconColor: '#FCA5A5',
    progressBarColor: '#FCA5A5',
    textColor: '#FFF7ED',
  },
  warn: {
    backgroundColor: '#6B4B18',
    closeIconColor: '#FFF7ED',
    iconColor: '#FDE68A',
    progressBarColor: '#FDE68A',
    textColor: '#FFF7ED',
  },
  info: {
    backgroundColor: '#4A3520',
    closeIconColor: '#F5ECD7',
    iconColor: '#C9A96E',
    progressBarColor: '#C9A96E',
    textColor: '#F5ECD7',
  },
};

function showToast(type: ToastKind, title: string, message?: string) {
  const colors = toastTheme[type];
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: type === 'error' ? 5000 : 3500,
    autoHide: true,
    backgroundColor: colors.backgroundColor,
    closeIconColor: colors.closeIconColor,
    iconColor: colors.iconColor,
    progressBarColor: colors.progressBarColor,
    textColor: colors.textColor,
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
