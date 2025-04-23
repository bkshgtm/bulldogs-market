import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment,
  type Timestamp,
  orderBy,
  limit,
  type Query,
  type DocumentData,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase-provider"
import type { UserProfile } from "./firebase-provider"

// Types
export type Item = {
  id: string
  name: string
  description: string
  category: string
  imageUrl: string
  quantity: number
  createdAt: Timestamp
}

export type Order = {
  id: string
  userId: string
  userEmail: string
  userName?: string
  items: {
    id: string
    name: string
    quantity: number
  }[]
  status: "pending" | "ready" | "completed" | "cancelled"
  pickupTime: string
  createdAt: Timestamp
  tokensUsed: number
}

export type TokenRequest = {
  id: string
  userId: string
  userEmail: string
  userName?: string
  reason: string
  tokensRequested: number
  status: "pending" | "approved" | "rejected"
  createdAt: Timestamp
}

export type Notification = {
  id: string
  userId: string
  message: string
  read: boolean
  createdAt: Timestamp
  type?: "order" | "inventory" | "token" | "system"
  relatedId?: string
}

// User functions
export async function getUserRole(userId: string): Promise<"student" | "admin" | null> {
  if (!db) return null

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      console.log("🔥 getUserRole fetched data:", userDoc.data())
      return userDoc.data().role as "student" | "admin"
    }
    return null
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) return null

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        role: userData.role || "student",
        photoURL: userData.photoURL || "",
        tokenBalance: userData.tokenBalance || 0,
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

export async function getAllStudents(): Promise<UserProfile[]> {
  if (!db) return []

  try {
    const usersQuery = query(collection(db, "users"), where("role", "==", "student"))

    const querySnapshot = await getDocs(usersQuery)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        role: data.role || "student",
        photoURL: data.photoURL || "",
        tokenBalance: data.tokenBalance || 0
      } as UserProfile
    })
  } catch (error) {
    console.error("Error getting all students:", error)
    return []
  }
}

export async function getUserTokenBalance(userId: string): Promise<number> {
  if (!db) return 0

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return userDoc.data().tokenBalance || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting token balance:", error)
    return 0
  }
}

export async function updateUserTokenBalance(userId: string, amount: number): Promise<void> {
  if (!db) return

  try {
    await updateDoc(doc(db, "users", userId), {
      tokenBalance: increment(amount),
    })
  } catch (error) {
    console.error("Error updating token balance:", error)
    throw error
  }
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  if (!storage || !db) throw new Error("Firebase storage not initialized")

  try {
    const storageRef = ref(storage, `profile-images/${userId}`)
    await uploadBytes(storageRef, file)

    const downloadURL = await getDownloadURL(storageRef)

    // Update user document with photo URL
    await updateDoc(doc(db, "users", userId), {
      photoURL: downloadURL,
    })

    return downloadURL
  } catch (error) {
    console.error("Error uploading profile image:", error)
    throw error
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (!db) return

  try {
    await updateDoc(doc(db, "users", userId), data)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export async function createUserProfile(
  userId: string,
  email: string,
  role: "student" | "admin" = "student",
  firstName = "",
  lastName = "",
): Promise<void> {
  if (!db) return

  try {
    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      // Update existing profile
      await updateDoc(doc(db, "users", userId), {
        email,
        role,
        firstName,
        lastName,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new profile
      await setDoc(doc(db, "users", userId), {
        email,
        role,
        firstName,
        lastName,
        tokenBalance: role === "student" ? 3 : 0, // Students start with 3 tokens
        createdAt: serverTimestamp(),
      })

      // Add welcome notification for new users
      if (role === "student") {
        await addNotification(
          userId,
          "Welcome to Bulldogs Market! You have 3 tokens to start with. Happy shopping!",
          "system",
        )
      }
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error)
    throw error
  }
}

// Item functions
export async function getItems(categoryFilter?: string): Promise<Item[]> {
  if (!db) return []

  try {
    let itemsQuery: Query<DocumentData> = collection(db, "items")

    if (categoryFilter) {
      itemsQuery = query(itemsQuery, where("category", "==", categoryFilter))
    }

    const querySnapshot = await getDocs(itemsQuery)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        imageUrl: data.imageUrl || "",
        quantity: data.quantity || 0,
        createdAt: data.createdAt || serverTimestamp()
      } as Item
    })
  } catch (error) {
    console.error("Error getting items:", error)
    return []
  }
}

export async function getOutOfStockItems(): Promise<Item[]> {
  if (!db) return []

  try {
    const itemsQuery = query(collection(db, "items"), where("quantity", "<=", 0))

    const querySnapshot = await getDocs(itemsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Item[]
  } catch (error) {
    console.error("Error getting out of stock items:", error)
    return []
  }
}

export async function getLowStockItems(threshold = 5): Promise<Item[]> {
  if (!db) return []

  try {
    const itemsQuery = query(collection(db, "items"), where("quantity", ">", 0), where("quantity", "<=", threshold))

    const querySnapshot = await getDocs(itemsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Item[]
  } catch (error) {
    console.error("Error getting low stock items:", error)
    return []
  }
}

export async function getItem(itemId: string): Promise<Item | null> {
  if (!db) return null

  try {
    const itemDoc = await getDoc(doc(db, "items", itemId))
    if (itemDoc.exists()) {
      return {
        id: itemDoc.id,
        ...itemDoc.data(),
      } as Item
    }
    return null
  } catch (error) {
    console.error("Error getting item:", error)
    return null
  }
}

export async function uploadItemImage(file: File): Promise<string> {
  if (!storage) throw new Error("Firebase storage not initialized")

  try {
    const storageRef = ref(storage, `item-images/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)

    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error("Error uploading item image:", error)
    throw error
  }
}

export async function addItem(item: Omit<Item, "id" | "createdAt">): Promise<string> {
  if (!db) throw new Error("Firestore not initialized")

  try {
    const docRef = await addDoc(collection(db, "items"), {
      ...item,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding item:", error)
    throw error
  }
}

export async function updateItem(itemId: string, data: Partial<Omit<Item, "id" | "createdAt">>): Promise<void> {
  if (!db) return

  try {
    // Get current item data
    const itemDoc = await getDoc(doc(db, "items", itemId))
    if (!itemDoc.exists()) {
      throw new Error("Item not found")
    }

    const currentItem = itemDoc.data() as Item

    // Check if quantity is being updated to zero
    if (data.quantity !== undefined && currentItem.quantity > 0 && data.quantity <= 0) {
      // Create notification for admins about out of stock item
      const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

      const adminsSnapshot = await getDocs(adminsQuery)
      const notificationPromises = adminsSnapshot.docs.map((doc) =>
        addNotification(doc.id, `Item "${currentItem.name}" is now out of stock.`, "inventory", itemId),
      )

      await Promise.all(notificationPromises)
    }

    await updateDoc(doc(db, "items", itemId), data)
  } catch (error) {
    console.error("Error updating item:", error)
    throw error
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  if (!db) return

  try {
    await deleteDoc(doc(db, "items", itemId))
  } catch (error) {
    console.error("Error deleting item:", error)
    throw error
  }
}

// Order functions
export async function createOrder(
  userId: string,
  userEmail: string,
  items: { id: string; name: string; quantity: number }[],
  pickupTime: string,
  tokensUsed: number,
  userName?: string,
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized")

  try {
    // Update item quantities
    const updatePromises = items.map(async (item) => {
      const itemRef = doc(db, "items", item.id)
      const itemDoc = await getDoc(itemRef)

      if (itemDoc.exists()) {
        const currentQuantity = itemDoc.data().quantity || 0
        const newQuantity = Math.max(0, currentQuantity - item.quantity)

        await updateDoc(itemRef, { quantity: newQuantity })

        // Check if item is now out of stock
        if (currentQuantity > 0 && newQuantity <= 0) {
          // Notify admins
          const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

          const adminsSnapshot = await getDocs(adminsQuery)
          const notificationPromises = adminsSnapshot.docs.map((doc) =>
            addNotification(doc.id, `Item "${item.name}" is now out of stock.`, "inventory", item.id),
          )

          await Promise.all(notificationPromises)
        }
      }
    })

    await Promise.all(updatePromises)

    // Create order
    const docRef = await addDoc(collection(db, "orders"), {
      userId,
      userEmail,
      userName,
      items,
      status: "pending",
      pickupTime,
      createdAt: serverTimestamp(),
      tokensUsed,
    })

    // Notify admins about new order
    const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

    const adminsSnapshot = await getDocs(adminsQuery)
    const notificationPromises = adminsSnapshot.docs.map((doc) =>
      addNotification(doc.id, `New order received from ${userEmail}.`, "order", docRef.id),
    )

    await Promise.all(notificationPromises)

    return docRef.id
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  if (!db) return []

  try {
    const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(ordersQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[]
  } catch (error) {
    console.error("Error getting user orders:", error)
    return []
  }
}

export async function getAllOrders(): Promise<Order[]> {
  if (!db) return []

  try {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(ordersQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[]
  } catch (error) {
    console.error("Error getting all orders:", error)
    return []
  }
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  if (!db) return

  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data() as Order

    await updateDoc(doc(db, "orders", orderId), {
      status,
    })

    // Send notification to user
    let notificationMessage = ""

    if (status === "ready") {
      notificationMessage =
        "Your order is ready for pickup! Please visit the Bulldogs Market during your selected time slot."
    } else if (status === "completed") {
      notificationMessage = "Your order has been marked as completed. Thank you for using Bulldogs Market!"
    } else if (status === "cancelled") {
      notificationMessage = "Your order has been cancelled. Please contact Bulldogs Market for more information."
    }

    if (notificationMessage) {
      await addNotification(orderData.userId, notificationMessage, "order", orderId)
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function cancelOrder(orderId: string, userId: string, tokensToRefund: number): Promise<void> {
  if (!db) return

  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    if (!orderDoc.exists()) {
      throw new Error("Order not found")
    }

    const orderData = orderDoc.data() as Order

    // Only refund tokens and return items to inventory if order is not completed
    if (orderData.status !== "completed") {
      // Return items to inventory
      const updatePromises = orderData.items.map(async (item) => {
        const itemRef = doc(db, "items", item.id)
        const itemDoc = await getDoc(itemRef)

        if (itemDoc.exists()) {
          const currentQuantity = itemDoc.data().quantity || 0
          await updateDoc(itemRef, {
            quantity: currentQuantity + item.quantity,
          })
        }
      })

      await Promise.all(updatePromises)

      // Update order status
      await updateDoc(doc(db, "orders", orderId), {
        status: "cancelled",
      })

      // Refund tokens
      await updateUserTokenBalance(userId, tokensToRefund)

      // Notify user
      await addNotification(
        userId,
        "Your order has been cancelled and your tokens have been refunded.",
        "order",
        orderId,
      )

      // Notify admins
      const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

      const adminsSnapshot = await getDocs(adminsQuery)
      const notificationPromises = adminsSnapshot.docs.map((doc) =>
        addNotification(doc.id, `Order #${orderId.slice(-6)} has been cancelled by the user.`, "order", orderId),
      )

      await Promise.all(notificationPromises)
    }
  } catch (error) {
    console.error("Error cancelling order:", error)
    throw error
  }
}

// Token request functions
export async function createTokenRequest(
  userId: string,
  userEmail: string,
  reason: string,
  tokensRequested: number,
  userName?: string,
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized")

  try {
    const docRef = await addDoc(collection(db, "tokenRequests"), {
      userId,
      userEmail,
      userName,
      reason,
      tokensRequested,
      status: "pending",
      createdAt: serverTimestamp(),
    })

    // Notify admins about new token request
    const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

    const adminsSnapshot = await getDocs(adminsQuery)
    const notificationPromises = adminsSnapshot.docs.map((doc) =>
      addNotification(doc.id, `New token request from ${userEmail} for ${tokensRequested} tokens.`, "token", docRef.id),
    )

    await Promise.all(notificationPromises)

    return docRef.id
  } catch (error) {
    console.error("Error creating token request:", error)
    throw error
  }
}

export async function getUserTokenRequests(userId: string): Promise<TokenRequest[]> {
  if (!db) return []

  try {
    const requestsQuery = query(
      collection(db, "tokenRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(requestsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TokenRequest[]
  } catch (error) {
    console.error("Error getting user token requests:", error)
    return []
  }
}

export async function getAllTokenRequests(): Promise<TokenRequest[]> {
  if (!db) return []

  try {
    const requestsQuery = query(collection(db, "tokenRequests"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(requestsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TokenRequest[]
  } catch (error) {
    console.error("Error getting all token requests:", error)
    return []
  }
}

export async function updateTokenRequest(requestId: string, status: "approved" | "rejected"): Promise<void> {
  if (!db) return

  try {
    const requestDoc = await getDoc(doc(db, "tokenRequests", requestId))
    if (!requestDoc.exists()) {
      throw new Error("Token request not found")
    }

    const requestData = requestDoc.data() as TokenRequest

    // Update request status
    await updateDoc(doc(db, "tokenRequests", requestId), {
      status,
    })

    // If approved, update user's token balance
    if (status === "approved") {
      await updateUserTokenBalance(requestData.userId, requestData.tokensRequested)

      // Create notification
      await addNotification(
        requestData.userId,
        `Your request for ${requestData.tokensRequested} additional tokens has been approved!`,
        "token",
        requestId,
      )
    } else if (status === "rejected") {
      // Create notification for rejection
      await addNotification(
        requestData.userId,
        `Your request for ${requestData.tokensRequested} additional tokens has been rejected.`,
        "token",
        requestId,
      )
    }
  } catch (error) {
    console.error("Error updating token request:", error)
    throw error
  }
}

// Notification functions
export async function addNotification(
  userId: string,
  message: string,
  type: "order" | "inventory" | "token" | "system" = "system",
  relatedId?: string,
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized")

  try {
    const notificationData: any = {
      userId,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    }

    // Only include relatedId if it's defined
    if (relatedId !== undefined) {
      notificationData.relatedId = relatedId
    }

    const docRef = await addDoc(collection(db, "notifications"), notificationData)
    return docRef.id
  } catch (error) {
    console.error("Error adding notification:", error)
    throw error
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  if (!db) return []

  try {
    // Create a composite index for this query in Firebase console
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20),
    )

    const querySnapshot = await getDocs(notificationsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[]
  } catch (error) {
    console.error("Error getting user notifications:", error)
    return []
  }
}

export async function getAdminNotifications(): Promise<Notification[]> {
  if (!db) return []

  try {
    const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"))

    const adminsSnapshot = await getDocs(adminsQuery)
    const adminIds = adminsSnapshot.docs.map((doc) => doc.id)

    if (adminIds.length === 0) return []

    // Get notifications for all admins
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "in", adminIds),
      orderBy("createdAt", "desc"),
      limit(50),
    )

    const querySnapshot = await getDocs(notificationsQuery)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[]
  } catch (error) {
    console.error("Error getting admin notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!db) return

  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!db) return

  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false),
    )

    const querySnapshot = await getDocs(notificationsQuery)

    // Update each notification
    const updatePromises = querySnapshot.docs.map((doc) => updateDoc(doc.ref, { read: true }))

    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Add weekly token reset functionality
export async function resetWeeklyTokens(): Promise<void> {
  if (!db) return

  try {
    // Get all student users
    const usersQuery = query(collection(db, "users"), where("role", "==", "student"))

    const querySnapshot = await getDocs(usersQuery)

    // Update each student's token balance to 3
    const updatePromises = querySnapshot.docs.map((doc) => updateDoc(doc.ref, { tokenBalance: 3 }))

    await Promise.all(updatePromises)

    // Add notification for each student
    const notificationPromises = querySnapshot.docs.map((doc) =>
      addNotification(doc.id, "Your weekly token balance has been reset to 3. Happy shopping!", "system"),
    )

    await Promise.all(notificationPromises)
  } catch (error) {
    console.error("Error resetting weekly tokens:", error)
    throw error
  }
}

// Email notification functions
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // This is a placeholder for email functionality
  // In a real application, you would integrate with an email service
  // like SendGrid, Mailgun, or AWS SES

  console.log(`Email sent to ${to} with subject: ${subject}`)
  console.log(`Body: ${body}`)

  // For now, we'll just log the email details
  // In a production environment, you would implement actual email sending
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  items: { name: string; quantity: number }[],
  pickupTime: string,
): Promise<void> {
  const subject = `Bulldogs Market - Order Confirmation #${orderId.slice(-6)}`

  const itemsList = items.map((item) => `- ${item.name} (Quantity: ${item.quantity})`).join("\n")

  const body = `
    Thank you for your order from Bulldogs Market!
    
    Order ID: #${orderId.slice(-6)}
    
    Items:
    ${itemsList}
    
    Pickup Time: ${new Date(pickupTime).toLocaleString()}
    
    Please bring your student ID when picking up your items.
    
    Thank you for using Bulldogs Market!
  `

  await sendEmail(email, subject, body)
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  orderId: string,
  status: Order["status"],
): Promise<void> {
  const subject = `Bulldogs Market - Order #${orderId.slice(-6)} Status Update`

  let statusMessage = ""

  if (status === "ready") {
    statusMessage =
      "Your order is now ready for pickup. Please visit the Bulldogs Market during your selected time slot."
  } else if (status === "completed") {
    statusMessage = "Your order has been marked as completed. Thank you for using Bulldogs Market!"
  } else if (status === "cancelled") {
    statusMessage =
      "Your order has been cancelled. If you did not request this cancellation, please contact Bulldogs Market staff."
  }

  const body = `
    Your Bulldogs Market order status has been updated.
    
    Order ID: #${orderId.slice(-6)}
    New Status: ${status.toUpperCase()}
    
    ${statusMessage}
    
    Thank you for using Bulldogs Market!
  `

  await sendEmail(email, subject, body)
}

export async function sendTokenRequestDecisionEmail(
  email: string,
  requestId: string,
  tokensRequested: number,
  approved: boolean,
): Promise<void> {
  const subject = `Bulldogs Market - Token Request ${approved ? "Approved" : "Rejected"}`

  const body = approved
    ? `
      Good news! Your request for ${tokensRequested} additional tokens has been approved.
      
      The tokens have been added to your account and are available for use immediately.
      
      Thank you for using Bulldogs Market!
    `
    : `
      We regret to inform you that your request for ${tokensRequested} additional tokens has been rejected.
      
      If you believe this is in error or would like to discuss this further, please contact Bulldogs Market staff.
      
      Thank you for your understanding.
    `

  await sendEmail(email, subject, body)
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const subject = `Bulldogs Market - Password Reset Request`

  const body = `
    We received a request to reset your password for Bulldogs Market.
    
    If you did not make this request, you can safely ignore this email.
    
    To reset your password, please follow the instructions sent in the official Firebase email.
    
    Thank you for using Bulldogs Market!
  `

  await sendEmail(email, subject, body)
}
