using Unique_X.DTOs;
using Unique_X.Models;

namespace Unique_X.Services.Interface
{
    public interface IPropertiesService
    {
        //Task<Property> AddPropertyAsync(PropertyFormDto dto, string brokerId);
        Task<PropertyResponseDto> AddPropertyAsync(PropertyFormDto dto, string brokerId);
        Task<PropertyResponseDto> UpdatePropertyAsync(int id, UpdatePropertyDto dto, string brokerId);
        Task<bool> DeletePropertyAsync(int id, string brokerId);
        Task<IEnumerable<PropertyResponseDto>> GetAllPropertiesAsync(PropertyFilterDto filter, string userId);
        Task<IEnumerable<PropertyResponseDto>> GetBrokerPropertiesAsync(string brokerId);
        Task<PropertyResponseDto> GetPropertyByIdAsync(int id);

        Task<bool> MarkAsSoldAsync(int id, string brokerId);
        Task<bool> SetExistingPhotoAsMainAsync(int propertyId, int photoId, string brokerId);
    }
}
