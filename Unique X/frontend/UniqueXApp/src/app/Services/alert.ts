import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  // رسالة نجاح
  success(message: string, title: string = 'Success') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonColor: '#ef3341', // لون الزرار الأحمر بتاعنا
      timer: 3000
    });
  }

  // رسالة خطأ
  error(message: string, title: string = 'Oops...') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonColor: '#002b52' // لون أزرق داكن للتباين
    });
  }

  // رسالة تنبيه أو تأكيد (زي "هل أنت متأكد من الحذف؟")
  confirm(message: string, callback: () => void) {
    Swal.fire({
      title: 'Are you sure?',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef3341',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, do it!'
    }).then((result) => {
      if (result.isConfirmed) {
        callback();
      }
    });
  }

  showLoading(message: string = 'Processing your request...') {
  Swal.fire({
    title: 'Please Wait',
    text: message,
    allowOutsideClick: false, // يمنع المستخدم من إغلاق الرسالة بالضغط بره
    showConfirmButton: false, // يخفي زرار OK
    didOpen: () => {
      Swal.showLoading(); // يشغل علامة التحميل
    }
  });
}

// إغلاق أي رسالة مفتوحة
close() {
  Swal.close();
}
}