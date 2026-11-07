using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Unique_X.Hubs
{
    // الـ Live Chat العام: مفتوح من غير تسجيل دخول. كل المتصلين في جروب واحد "live"
    [AllowAnonymous]
    public class LiveChatHub : Hub
    {
        public const string Group = "live";

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, Group);
            await base.OnConnectedAsync();
        }
    }
}