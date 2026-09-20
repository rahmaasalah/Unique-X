using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Unique_X.Helpers;
using Unique_X.Services.Interface;

namespace Unique_X.Filters
{
    // 🟢 بيتحط على مستوى AdminController كله بدل [Authorize(Roles = "Admin")] القديم.
    // الأدمن الكامل (Role = Admin) بيعدي كل حاجة زي ما كان بالظبط.
    // أي حد تاني (صاحب custom role) بيتحقق إن معاه صلاحية التاب/الـ Action ده تحديدًا.
    public class AdminPermissionFilter : IAsyncActionFilter
    {
        private readonly IPermissionService _permissionService;

        public AdminPermissionFilter(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // لو الـ Action معمول عليها [AllowAnonymous] صراحة (زي brokers-with-codes) سيبها تعدي عادي
            if (context.ActionDescriptor.EndpointMetadata.Any(m => m is AllowAnonymousAttribute))
            {
                await next();
                return;
            }

            if (context.HttpContext.User?.Identity?.IsAuthenticated != true)
            {
                context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
                return;
            }

            var actionName = (context.ActionDescriptor as ControllerActionDescriptor)?.ActionName ?? string.Empty;

            // 🟢 قراءة الـ Lookups (المناطق/المشاريع/المطورين) مفتوحة لأي حد Login وواصل لصفحات الـ CRM -
            // مش محتاجة صلاحية "lookups" لأنها بيانات عرض بس، مش تعديل. التعديل (Add/Delete) لسه محتاج الصلاحية.
            if (AdminActionPermissionMap.PublicReadActions.Contains(actionName))
            {
                await next();
                return;
            }

            string permissionKey;

            if (actionName.Equals(AdminActionPermissionMap.ActivityLogsAction, StringComparison.OrdinalIgnoreCase))
            {
                var type = context.RouteData.Values["type"]?.ToString()?.ToLower() ?? string.Empty;
                permissionKey = type.Contains("whatsapp") ? "whatsapp" : "calls";
            }
            else if (!AdminActionPermissionMap.Map.TryGetValue(actionName, out permissionKey!))
            {
                // ⚠️ Fail closed: أي Action جديد اتضاف بعدين ومحطش في الخريطة، بيتطلب صلاحية "settings"
                // (يعني هيبقى متاح بس للأدمن الكامل لحد ما حد يضيفه في AdminActionPermissionMap)
                permissionKey = "settings";
            }

            var allowed = await _permissionService.HasPermissionAsync(
                context.HttpContext.User, PermissionCatalog.DashboardAdmin, permissionKey);

            if (!allowed)
            {
                context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult(new
                {
                    message = "You don't have permission to access this section.",
                    permissionKey
                })
                { StatusCode = 403 };
                return;
            }

            await next();
        }
    }
}