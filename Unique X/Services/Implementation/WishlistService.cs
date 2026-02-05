using Microsoft.EntityFrameworkCore;
using Unique_X.Data;
using Unique_X.DTOs;
using Unique_X.Models;
using Unique_X.Services.Interface;

namespace Unique_X.Services.Implementation
{
    public class WishlistService : IWishlistService
    {
        private readonly AppDbContext _context;

        public WishlistService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ToggleWishlistAsync(string userId, int propertyId)
        {
            // 1. نتأكد إن العقار موجود أصلاً
            var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId);
            if (!propertyExists) return false;

            // 2. نشوف هل العقار ده موجود في مفضلة المستخدم ده قبل كدة؟
            var existingItem = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.PropertyId == propertyId);

            if (existingItem != null)
            {
                // لو موجود -> نحذفه (Unfavorite)
                _context.Wishlists.Remove(existingItem);
                await _context.SaveChangesAsync();
                return false; // يعني مابقاش في المفضلة
            }
            else
            {
                // لو مش موجود -> نضيفه (Favorite)
                var newItem = new Wishlist
                {
                    UserId = userId,
                    PropertyId = propertyId
                };
                await _context.Wishlists.AddAsync(newItem);
                await _context.SaveChangesAsync();
                return true; // يعني بقى في المفضلة
            }
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetUserWishlistAsync(string userId)
        {
            // جلب العقارات اللي اليوزر عاملها لايك مع صورها وبيانات البروكر
            var wishlist = await _context.Wishlists
                .Include(w => w.Property)
                    .ThenInclude(p => p.Photos)
                .Include(w => w.Property)
                    .ThenInclude(p => p.Broker)
                .Where(w => w.UserId == userId)
                .Select(w => w.Property)
                .ToListAsync();

            // تحويل النتائج للـ DTO اللي الفرونت اند بيفهمه
            return wishlist.Select(p => new PropertyResponseDto
            {
                Id = p.Id,
                Title = p.Title,
                Price = p.Price,
                Area = p.Area,
                Rooms = p.Rooms,
                Bathrooms = p.Bathrooms,
                City = p.City.ToString(),
                ListingType = p.ListingType.ToString(),
                PropertyType = p.PropertyType.ToString(),
                Region = p.Region,
                CreatedAt = p.CreatedAt,
                Photos = p.Photos.Select(ph => new PhotoResponseDto { Url = ph.Url, IsMain = ph.IsMain }).ToList(),
                BrokerName = p.Broker.FirstName + " " + p.Broker.LastName,
                IsFavorite = true,
                BrokerPhone = p.Broker.PhoneNumber
            });
        }
    }
}