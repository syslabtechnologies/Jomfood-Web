# API & Web Integration Guide: My Deals

This document outlines the API endpoints for accessing Claimed Deal History and Favorites, along with UI/UX guidelines for integrating these features into a web application.

## 1. API Documentation

### A. Claimed Deal History

Retrieves the paginated history of deals claimed by a user.

- **Endpoint:** `GET /jomfood-deals/claims/history`
- **Function Ref:** `dealsAPI.getClaimHistory`

#### Request Parameters (Query)

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | `string` | **Yes** | User's MongoDB ID (24-char hex). |
| `page` | `number` | No | Page number (default: 1). |
| `limit` | `number` | No | Items per page (default: 10). |
| `lang` | `string` | No | Language code (`en` or `malay`). |

#### Response JSON

```json
{
    "success": true,
    "data": {
        "claims": [
            {
                "_id": "694d1101e1d055a0f60dc310",
                "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAA...",
                "qr_code_public_url": "https://jomsmart-staging.s3.amazonaws.com/qr-codes/qr-code-1766658305943-9bb878b5.png",
                "status": "active",
                "redeemed_at": null,
                "redeemed_by": null,
                "customer_phone": "03017422047",
                "customer_email": "kashifkazmi1412@gmail.com",
                "deal_id": "694351861f72b4c4da54c625",
                "customer_id": "692018bd208b40ce471b9580",
                "deal_name": "Ikan Siaka",
                "deal_total": 40.5,
                "deal_type": "percentage",
                "expires_at": "2025-12-31T09:45:00.000Z",
                "customer_name": "Syed Kashif Kazmi",
                "claimed_at": "2025-12-25T10:25:05.860Z",
                "createdAt": "2025-12-25T10:25:05.862Z",
                "updatedAt": "2025-12-25T10:25:06.272Z",
                "business_id": {
                    "_id": "6900a18b340f6be762b09188",
                    "company_name": "Iqan Bakar Cheras",
                    "image_url": "2020-02-03profileimg.png"
                },
                "deal_details": {
                    "_id": "694351861f72b4c4da54c625",
                    "deal_name": "Ikan Siaka",
                    "discount_percentage": 0,
                    "discount_amount": 4.5,
                    "deal_type": "fixed_amount",
                    "deal_total": 40.5,
                    "original_total": 45,
                    "deal_image": "https://jomsmart-staging.s3.amazonaws.com/6944d8c5c609e34e7dfae494/Ikan_Siaka/1766120475090_c3f80576-756d-41c5-a30c-2ec7db734c57_Ikan_Siaka_New.png"
                }
            }
        ],
        "pagination": {
            "has_next": true,
            "current_page": 1,
            "total_pages": 5
        }
    }
}
```

---

### B. Favorite Deals

Retrieves the paginated list of user's favorite deals.

- **Endpoint:** `GET /jomfood-deals/favorites`
- **Function Ref:** `favoritesAPI.getFavoriteDeals`

#### Request Parameters (Query)

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | No | Page number (default: 1). |
| `limit` | `number` | No | Items per page (default: 12). |
| `sort_by` | `string` | No | Sort order (e.g., `favorited_newest`). |
| `deal_type` | `string` | No | Optional filter by deal type. |

#### Response JSON

```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "_id": "654c12...",
        "title": "50% Off Sushi Platter",
        "description": "Fresh salmon and tuna platter...",
        "price": 25.00,
        "original_price": 50.00,
        "discount_percentage": 50,
        "images": [
          "https://cdn.jomfood.com/deals/sushi.jpg"
        ],
        "merchant": {
          "_id": "651a2b...",
          "name": "Sakura Japanese Dining",
          "logo": "https://cdn.jomfood.com/logos/sakura.jpg"
        },
        "is_favorite": true,
        "favorited_at": "2023-10-28T14:30:00.000Z"
      }
    ],
    "pagination": {
      "has_next": true,
      "current_page": 1,
      "total_pages": 3,
      "total_items": 28
    }
  }
}
```

---

## 2. Web UI Integration Guidelines

To translate the React Native `MyDealsScreen` to a responsive web interface, follow these guidelines.

### A. Layout Structure

The "My Deals" page should likely be a dashboard section or a dedicated page with two main views, toggleable via tabs or a sub-navigation menu.

**Tabs:**
1.  **Claimed Deals** (Defaults to this)
2.  **Favorites**

#### 1. Claimed Deals (List/Table View)
Since claimed deals are transaction records, a **List** or **Card Row** layout works best.

*   **Desktop:** Use a comfortable list view where each row represents a claim.
    *   **Columns/Sections:**
        *   **Left:** Deal Image (thumbnail) + Deal Name.
        *   **Middle:** Business Name + Price (formatted e.g., RM45.00).
        *   **Right:** Status Badge (Active, Redeemed, Expired) + Action Button (e.g., "View QR").
*   **Mobile:** Stacked card view (similar to the mobile app).
    *   Image/Title on top row.
    *   Business/Price on second row.
    *   Status/Date footer.

**UI Component: Status Badge**
*   **Active:** Green background/text (e.g., `bg-green-100 text-green-800`).
*   **Redeemed:** Blue or Gray (e.g., `bg-blue-100 text-blue-800`).
*   **Expired:** Gray or Red (muted) (e.g., `bg-gray-100 text-gray-500`).

**Interaction:**
*   Clicking a "View QR" button or the row should open a **Modal** (analogous to the BottomSheet in app) displaying the QR code and full details.

#### 2. Favorite Deals (Grid View)
Favorites are distinct items to be browsed. Use a **Grid Layout**.

*   **Grid Specs:**
    *   **Desktop:** 4 columns (`grid-cols-4`).
    *   **Tablet:** 3 columns (`grid-cols-3`).
    *   **Mobile:** 1 or 2 columns (`grid-cols-1` or `grid-cols-2`).
*   **Card Composition:**
    *   **Image:** Aspect ratio 4:3 or 16:9, taking up the top half.
    *   **Content:** Title (truncated 2 lines), Business Name (muted), Price (highlighted), Original Price (strikethrough).
    *   **Actions:** "Heart" icon (filled red) in top-right corner to un-favorite. "View" button or entire card clickable to navigate to Deal Detail page.

### B. Functional Requirements

1.  **Infinite Scroll vs. Pagination:**
    *   **Web Standard:** Traditional **Pagination** (Page 1, 2, 3...) is often better for web "My Account" sections than infinite scroll, as it allows easier navigation and footer access. However, if staying true to the mobile "feed" feel, use a "Load More" button rather than auto-triggering on scroll to prevent footer jumping.
    *   *Recommendation:* Use a "Load More" button at the bottom of the grid/list.

2.  **Empty States:**
    *   **No Claims:** Show a friendly illustration (e.g., shopping bag) with a "Browse Deals" button redirecting to the home/deals listing.
    *   **No Favorites:** "Heart" illustration with "Start saving deals you love!" text.

3.  **Loading Skeletons:**
    *   While fetching data (`isLoading`), display shimmer skeletons matching the layout (List skeletons for Claims, Card skeletons for Favorites) to reduce layout shift (`CLS`).

### C. Technology Suggestions (React Web)

*   **State Management:** Use `TanStack Query` (React Query) just like the app. It's perfect for web too (handling `isLoading`, `isFetchingNextPage`, caching).
*   **Styling:** TailwindCSS is highly recommended for rapid responsive grids.
    *   *Grid:* `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"`
    *   *Card Hover:* `className="transition-shadow hover:shadow-lg duration-300"`

### D. Mockup Code Snippet (React/Tailwind)

```jsx
// Example Claimed Deal Row Component
const ClaimRow = ({ claim, onOpenQr }) => (
  <div className="flex flex-col md:flex-row items-start md:items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition gap-4">
    {/* Info */}
    <div className="flex-1">
      <h3 className="font-semibold text-lg">{claim.deal_details.deal_name}</h3>
      <p className="text-gray-500 text-sm">{claim.business_id.company_name}</p>
    </div>
    
    {/* Price & Status */}
    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
      <span className="font-bold text-primary">RM{claim.deal_details.deal_total}</span>
      
      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase
        ${claim.status === 'active' ? 'bg-green-100 text-green-700' : 
          claim.status === 'redeemed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        {claim.status}
      </span>
      
      <button 
        onClick={() => onOpenQr(claim)}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
      >
        View QR
      </button>
    </div>
  </div>
);
```



response:
{
    "success": true,
    "data": {
        "claims": [
            {
                "_id": "694d1101e1d055a0f60dc310",
                "qr_code_image": "data:image/png;base64,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",
                "qr_code_public_url": "https://jomsmart-staging.s3.amazonaws.com/qr-codes/qr-code-1766658305943-9bb878b5.png",
                "status": "active",
                "redeemed_at": null,
                "redeemed_by": null,
                "customer_phone": "03017422047",
                "customer_email": "kashifkazmi1412@gmail.com",
                "deal_id": "694351861f72b4c4da54c625",
                "customer_id": "692018bd208b40ce471b9580",
                "qr_code_data": "https://www.jomfood.my/deal-validity?claim_id=694d1101e1d055a0f60dc310&deal_id=694351861f72b4c4da54c625&customer_id=692018bd208b40ce471b9580&business_id=6900a18b340f6be762b09188&group_id=6900a18adcab94faca7b9c39",
                "deal_name": "Ikan Siaka",
                "deal_total": 40.5,
                "deal_type": "percentage",
                "expires_at": "2025-12-31T09:45:00.000Z",
                "customer_name": "Syed Kashif Kazmi",
                "claimed_at": "2025-12-25T10:25:05.860Z",
                "createdAt": "2025-12-25T10:25:05.862Z",
                "updatedAt": "2025-12-25T10:25:06.272Z",
                "business_id": {
                    "_id": "6900a18b340f6be762b09188",
                    "id": "1",
                    "business_group": "6900a18adcab94faca7b9c39",
                    "__v": 0,
                    "address": "IQAN BAKAR CHERAS, CHERAS, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
                    "average_rating": "5",
                    "company_name": "Iqan Bakar Cheras",
                    "createdAt": "2025-10-28T10:57:15.090Z",
                    "datetime_created": "2019-11-04 08:14:23",
                    "email": "info@iqanbakarcheras.com",
                    "free_distance": "2",
                    "ic_back_url": "1121572855583_58.png",
                    "ic_front_url": "2921572855583_58.jpg",
                    "image_url": "2020-02-03profileimg.png",
                    "is_food_seller": null,
                    "lat": "3.1288529",
                    "lng": "101.7200159",
                    "mobile_number": "+60192219411",
                    "mp_id": "JF01",
                    "office_phone": "+60192219411",
                    "race": "Others",
                    "updatedAt": "2025-12-31T11:53:05.663Z"
                },
                "group_id": {
                    "_id": "6900a18adcab94faca7b9c39",
                    "isSyncEnabled": true,
                    "name": "Iqan Bakar Cheras",
                    "description": "",
                    "api_key": "AIzaSyA9KPeiF-fL5OQCXBoPX8hFkQVyqp8ipkA",
                    "business_group_url": "https://system.iqanbakarcheras.com/",
                    "business_group_frontend_url": "https://www.iqanbakarcheras.com/",
                    "createdAt": "2025-10-28T10:57:14.703Z",
                    "updatedAt": "2025-10-28T10:57:14.703Z",
                    "__v": 0
                },
                "deal_details": {
                    "_id": "694351861f72b4c4da54c625",
                    "deal_description": "",
                    "manual_original_amount": null,
                    "discount_percentage": 0,
                    "discount_amount": 4.5,
                    "is_active": true,
                    "status": "active",
                    "ishotdeal": false,
                    "consumptionType": [
                        "dine-in",
                        "self_pickup",
                        "delivery"
                    ],
                    "max_quantity": 1,
                    "deal_image": "https://jomsmart-staging.s3.amazonaws.com/6944d8c5c609e34e7dfae494/Ikan_Siaka/1766120475090_c3f80576-756d-41c5-a30c-2ec7db734c57_Ikan_Siaka_New.png",
                    "tags": [],
                    "deal_category_id": "69291c0602b683d00bc1e67c",
                    "business_id": "6900a18b340f6be762b09188",
                    "group_id": "6900a18adcab94faca7b9c39",
                    "deal_name": "Ikan Siaka",
                    "deal_type": "fixed_amount",
                    "deal_items": [
                        {
                            "product_image": "https://system.iqanbakarcheras.com/uploads/sellers/products/1764643081692e5109d5abeWhatsAppImage2025-11-27at1.06.49PM-2.jpeg",
                            "product_sku": null,
                            "category_id": "8",
                            "category_name": "Iqan Bakar",
                            "quantity": 1,
                            "_id": "694351861f72b4c4da54c626",
                            "product_id": "693655d5dbf94fe25c4b9e2f",
                            "product_name": "Ikan Siaka",
                            "product_price": 45
                        }
                    ],
                    "original_total": 45,
                    "deal_total": 40.5,
                    "start_date": "2025-12-23T09:00:00.000Z",
                    "end_date": "2025-12-31T09:45:00.000Z",
                    "created_by": "690c329bc816c81c17ca7e9b",
                    "createdAt": "2025-12-18T00:57:42.211Z",
                    "updatedAt": "2025-12-26T09:01:38.556Z",
                    "__v": 0
                },
                "customer_details": {
                    "_id": "692018bd208b40ce471b9580",
                    "authProvider": "both",
                    "status": true,
                    "name": "Syed Kashif Kazmi",
                    "email": "kashifkazmi1412@gmail.com",
                    "password": "$2a$10$s0CyzB2MQaBgU8KElclKduJjWcdIisi3xF0MyLHAJ0W0l/0tXDoSC",
                    "phone": "03017422047",
                    "createdAt": "2025-11-21T07:46:05.974Z",
                    "updatedAt": "2025-11-28T17:32:01.666Z",
                    "__v": 0,
                    "googleId": "113328026290204017213",
                    "image": "https://lh3.googleusercontent.com/a/ACg8ocJiclr0dms29DHBlsy0jZmqajwyLNJUGgR396RVAUl2cDdi4dI=s96-c"
                }
            },
            {
                "_id": "69494701e1d055a0f60d87f3",
                "qr_code_image": "data:image/png;base64,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",
                "qr_code_public_url": "https://jomsmart-staging.s3.amazonaws.com/qr-codes/qr-code-1766409985577-87971585.png",
                "status": "active",
                "redeemed_at": null,
                "redeemed_by": null,
                "customer_phone": "03017422047",
                "customer_email": "kashifkazmi1412@gmail.com",
                "deal_id": "694350271f72b4c4da54b35b",
                "customer_id": "692018bd208b40ce471b9580",
                "qr_code_data": "https://www.jomfood.my/deal-validity?claim_id=69494701e1d055a0f60d87f3&deal_id=694350271f72b4c4da54b35b&customer_id=692018bd208b40ce471b9580&business_id=68d751b3c068e53177f459f0&group_id=68d751b2750b9b19bf3d4ac4",
                "deal_name": "Chicken Kabsah Half",
                "deal_total": 22.5,
                "deal_type": "percentage",
                "expires_at": "2025-12-24T16:00:00.000Z",
                "customer_name": "Syed Kashif Kazmi",
                "claimed_at": "2025-12-22T13:26:25.524Z",
                "createdAt": "2025-12-22T13:26:25.526Z",
                "updatedAt": "2025-12-22T13:26:25.887Z",
                "business_id": {
                    "_id": "68d751b3c068e53177f459f0",
                    "business_group": "68d751b2750b9b19bf3d4ac4",
                    "id": "1",
                    "__v": 0,
                    "address": "Alkhair Restaurant, Jalan Ampang Kiri, Kampung Berembang, Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia",
                    "average_rating": "5",
                    "company_name": "Alkhair Restaurant",
                    "createdAt": "2025-09-27T02:53:39.089Z",
                    "datetime_created": "2019-11-04 08:14:23",
                    "email": "info@alkhairrestaurant.com",
                    "free_distance": "2",
                    "ic_back_url": "1121572855583_58.png",
                    "ic_front_url": "2921572855583_58.jpg",
                    "image_url": "2020-02-03profileimg.png",
                    "is_food_seller": null,
                    "lat": "3.1599965",
                    "lng": "101.7454832",
                    "mobile_number": "+60342651144",
                    "mp_id": "JF01",
                    "office_phone": "+60342651144",
                    "race": "Islam",
                    "updatedAt": "2025-12-31T11:53:04.642Z"
                },
                "group_id": {
                    "_id": "68d751b2750b9b19bf3d4ac4",
                    "isSyncEnabled": true,
                    "name": "Al Khair Restaurant",
                    "description": "Al Khair",
                    "api_key": "AIzaSyA9KPeiF-fL5OQCXBoPX8hFkQVyqp8ipkA",
                    "business_group_url": "https://system.alkhairrestaurant.com/",
                    "createdAt": "2025-09-27T02:53:38.398Z",
                    "updatedAt": "2025-10-20T05:34:52.407Z",
                    "__v": 0,
                    "business_group_frontend_url": "https://alkhairrestaurant.com/"
                },
                "deal_details": {
                    "_id": "694350271f72b4c4da54b35b",
                    "deal_description": "",
                    "manual_original_amount": null,
                    "discount_percentage": 10,
                    "discount_amount": 2.5,
                    "is_active": true,
                    "status": "active",
                    "ishotdeal": false,
                    "consumptionType": [
                        "dine-in"
                    ],
                    "max_quantity": null,
                    "deal_image": "https://jomsmart-staging.s3.amazonaws.com/6944c565c609e34e7dfab88e/Chicken_Kabsah_Half/1766119784866_c5c208ca-3a7e-48d7-9fcd-41583a7706a8_Chicken_Kabsah_Half_New.png",
                    "tags": [],
                    "deal_category_id": "6926925f02b683d00bc1bd10",
                    "business_id": "68d751b3c068e53177f459f0",
                    "group_id": "68d751b2750b9b19bf3d4ac4",
                    "deal_name": "Chicken Kabsah Half",
                    "deal_type": "percentage",
                    "deal_items": [
                        {
                            "product_image": "https://system.alkhairrestaurant.com/uploads/sellers/products/175584752368a81b633e6f8chickenKabsahHalf.jpg",
                            "product_sku": null,
                            "category_id": "7",
                            "category_name": "Chicken",
                            "quantity": 1,
                            "_id": "694350271f72b4c4da54b35c",
                            "product_id": "68da5681c068e53177f6f97f",
                            "product_name": "Chicken Kabsah Half",
                            "product_price": 25
                        }
                    ],
                    "original_total": 25,
                    "deal_total": 22.5,
                    "start_date": "2025-12-17T16:00:00.000Z",
                    "end_date": "2025-12-24T16:00:00.000Z",
                    "created_by": "690c329bc816c81c17ca7e9b",
                    "createdAt": "2025-12-18T00:51:51.864Z",
                    "updatedAt": "2025-12-19T04:49:48.573Z",
                    "__v": 0
                },
                "customer_details": {
                    "_id": "692018bd208b40ce471b9580",
                    "authProvider": "both",
                    "status": true,
                    "name": "Syed Kashif Kazmi",
                    "email": "kashifkazmi1412@gmail.com",
                    "password": "$2a$10$s0CyzB2MQaBgU8KElclKduJjWcdIisi3xF0MyLHAJ0W0l/0tXDoSC",
                    "phone": "03017422047",
                    "createdAt": "2025-11-21T07:46:05.974Z",
                    "updatedAt": "2025-11-28T17:32:01.666Z",
                    "__v": 0,
                    "googleId": "113328026290204017213",
                    "image": "https://lh3.googleusercontent.com/a/ACg8ocJiclr0dms29DHBlsy0jZmqajwyLNJUGgR396RVAUl2cDdi4dI=s96-c"
                }
            },
        ],
        "pagination": {
            "current_page": 1,
            "total_pages": 2,
            "total_claims": 11,
            "has_next": true,
            "has_prev": false
        }
    }
}