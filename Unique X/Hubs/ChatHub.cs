using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Unique_X.Hubs
{
    // الـ Hub بس لاستقبال الرسائل لحظيًا. الإرسال نفسه بيتم من ChatController (عشان رفع الصور)
    // كل يوزر بيتعرّف بالـ NameIdentifier، والسيرفر بيبعتله عن طريق Clients.User(userId)
    [Authorize]
    public class ChatHub : Hub
    {
    }
}