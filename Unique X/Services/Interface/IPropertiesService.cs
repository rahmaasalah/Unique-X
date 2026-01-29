using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Services.Interface
{
    public interface IPropertiesService
    {
        //Task<Property> AddPropertyAsync(PropertyFormDto dto, string brokerId);
        Task<Property> AddPropertyAsync(PropertyFormDto dto, string brokerId);
    }
}
