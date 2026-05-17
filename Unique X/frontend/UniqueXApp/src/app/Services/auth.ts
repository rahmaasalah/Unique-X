import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  baseUrl = environment.apiUrl + '/auth/';

  constructor(private http: HttpClient) { }

  login(model: any) {
  return this.http.post<any>(this.baseUrl + 'login', model).pipe(
    map((response: any) => {
      if (response && response.token) {
        // التخزين لازم يحصل هنا فوراً
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
      }
      return response;
    })
  );
}

getBrokers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}brokers`);
}

getAdminContact(): Observable<any> {
  return this.http.get(`${this.baseUrl}admin-contact`);
}

  register(model: any) {
    return this.http.post(this.baseUrl + 'register', model);
  }

  loggedIn() {
    const token = localStorage.getItem('token');
    return !!token; 
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUserType(): number {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.roles?.includes('Broker') ? 1 : 0; 
  // أو بناءً على الحقل اللي بيجيلك من الباك اند مباشرة
}

getUserName(): string {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.username || 'User';
}

getProfile(): Observable<any> {
  return this.http.get(`${this.baseUrl}profile`);
}

updateProfile(model: any): Observable<any> {
  return this.http.put(`${this.baseUrl}profile`, model);
}

uploadProfileImage(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`${this.baseUrl}upload-profile-image`, formData);
}
getUserImage(): string | null {
  const userString = localStorage.getItem('user');
  if (userString) {
    const user = JSON.parse(userString);
    // تأكدي إن الاسم مطابق للي بيتخزن عندك (غالباً profileImageUrl)
    return user.profileImageUrl || null;
  }
  return null;
}

forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}forgot-password`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}reset-password`, data);
  }

  readonly ALLOWED_CRM_BROKERS =[
    'e08be7c4-b9bd-47bd-af4c-a342e40ae138', // hussien ehab done
    'eb1e66ec-7f68-4b96-a06a-9a7b552f13e6', // alaa ashraf done
    'ec5711a3-e0f7-46a6-8005-1e35b2a83340', // Abdelrahman ashraf done
    'ed4dd2c3-cdf6-441d-a9a2-c152ff2bb420', // mohammed Khaled done
    'f578d13d-463c-4e0f-b7ba-5085f40c45da', // mohammed ali  done

    'fad6773a-1817-438f-823b-ad506fa24bf5', // nadia salem  done
    '6aca6241-1f79-46d3-8b7a-f201fe74aed5', // Hager I  done
    '963361c9-5ebd-4f85-b64a-a6cb735f880f', // Mostafa elsayed  done

    '9c380943-0426-44e4-8c67-0483757146aa', // yassmin mohammed   done
    '371bc67c-e4dc-43e6-9179-4649ea029d06', // Ibrahim Mahmoud    done
    '4ea34b6d-dec4-4da3-af6e-cc0f40abf52b', // belal el sayed      done

    '55ef8463-f1f4-4df9-baaf-8dff22cdd749', // ahmed Ramadan   done
    '0e831dbd-0759-47ed-9c04-228b035e9dfd', // Mahmoud ali   done 
    '181a5dca-351a-4591-92b0-21bf8f0d8ec7', // hager mohammed   done
    '1cd68260-56f3-4170-acc2-6006f07a70db', // Menna ameen   done
    '31231037-96e7-405a-ab41-9894c91c5563', // mayar elkhalil   done
    '5a48b6c0-d4ee-4559-a9b1-3791a155b3c4' , // Tarek test   done
    'e42dd9df-25f3-4830-890a-60586728b290' // abeer ashraf
  ];

  // 👇 2. دالة الفحص (بتسمح للأدمن وللبروكرز اللي في القائمة بس)
  isAllowedToOpenCrm(): boolean {
    const userString = localStorage.getItem('user');
    if (!userString) return false;
    
    const user = JSON.parse(userString);
    const roles = user.roles ||[];
    
    // لو أدمن، دايماً مسموحله يدخل
    if (roles.includes('Admin') || user.userType === 2 || user.userType === 'Admin') {
      return true;
    }

    // لو بروكر، نفحص هل الـ ID بتاعه موجود في القائمة ولا لأ
    const userId = user.id || user.userId;
    return this.ALLOWED_CRM_BROKERS.includes(userId);
  }
}