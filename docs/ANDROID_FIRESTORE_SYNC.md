# Android Firestore Sync Architecture

This dashboard workspace does not include Android source files. Use this guide to wire the Android app to the standardized `bookings` schema used by the admin dashboard.

## Collections

- `bookings/{bookingDocId}`
- `bookings/{bookingDocId}/timeline/{timelineId}`
- `bookings/{bookingDocId}/adminNotes/{noteId}` admin only

## My Notices Listener

```kotlin
fun listenToMyNotices(
    currentUserId: String,
    onChange: (List<Booking>) -> Unit,
    onError: (Exception) -> Unit
): ListenerRegistration {
    return FirebaseFirestore.getInstance()
        .collection("bookings")
        .whereEqualTo("userId", currentUserId)
        .orderBy("createdAt", Query.Direction.DESCENDING)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onError(error)
                return@addSnapshotListener
            }

            onChange(snapshot.orEmpty().documents.mapNotNull { it.toObject(Booking::class.java) })
        }
}
```

## Booking Detail Listener

```kotlin
fun listenToBookingDetail(
    bookingDocId: String,
    onChange: (Booking?) -> Unit,
    onError: (Exception) -> Unit
): ListenerRegistration {
    return FirebaseFirestore.getInstance()
        .collection("bookings")
        .document(bookingDocId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onError(error)
                return@addSnapshotListener
            }

            onChange(snapshot?.toObject(Booking::class.java))
        }
}
```

## User Timeline Listener

```kotlin
fun listenToUserTimeline(
    bookingDocId: String,
    onChange: (List<TimelineEntry>) -> Unit,
    onError: (Exception) -> Unit
): ListenerRegistration {
    return FirebaseFirestore.getInstance()
        .collection("bookings")
        .document(bookingDocId)
        .collection("timeline")
        .whereEqualTo("visibleToUser", true)
        .orderBy("createdAt", Query.Direction.ASCENDING)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                onError(error)
                return@addSnapshotListener
            }

            onChange(snapshot.orEmpty().documents.mapNotNull { it.toObject(TimelineEntry::class.java) })
        }
}
```

## Android UI States

- `UNDER_REVIEW`: show "Your booking is under review."
- `PRICE_CONFIRMED`: show "Final price confirmed.", total price, and "Proceed to Payment".
- `PAYMENT_PENDING`: show "Payment pending.", amount, and payment CTA.
- `PAID`: show "Payment received. Your notice will be sent to newspaper."
- `SENT_TO_NEWSPAPER`: show "Sent to newspaper."
- `PUBLISHED`: show "Published successfully." Show "Download Publication Proof" when `publication.proofUrl` exists.
- `DOCUMENTS_REJECTED`: show each document `rejectionReason` and a "Re-upload Documents" button.

## Placeholder Payment Flow

Do not integrate Razorpay or Cashfree in this phase.

```kotlin
fun simulateSuccessfulPayment(
    bookingDocId: String,
    currentUserEmail: String,
    onComplete: () -> Unit,
    onError: (Exception) -> Unit
) {
    val db = FirebaseFirestore.getInstance()
    val bookingRef = db.collection("bookings").document(bookingDocId)
    val timelineRef = bookingRef.collection("timeline").document()

    db.runBatch { batch ->
        batch.update(
            bookingRef,
            mapOf(
                "payment.status" to "PAID",
                "payment.paidAt" to FieldValue.serverTimestamp(),
                "payment.receiptUrl" to null,
                "paymentStatus" to "PAID",
                "status" to "PAID",
                "updatedAt" to FieldValue.serverTimestamp()
            )
        )
        batch.set(
            timelineRef,
            mapOf(
                "status" to "PAID",
                "message" to "Payment completed successfully.",
                "visibleToUser" to true,
                "createdBy" to currentUserEmail,
                "createdAt" to FieldValue.serverTimestamp()
            )
        )
    }.addOnSuccessListener { onComplete() }
     .addOnFailureListener { onError(it) }
}
```

## Receipt Placeholder

When `payment.status == "PAID"` and `payment.receiptUrl == null`, show:

```text
Receipt will be generated soon.
```

Do not break the UI if `receiptUrl` is missing.

## Publication Proof Placeholder

When `publication.status == "PUBLISHED"`:

- If `publication.proofUrl` exists, show "Download Publication Proof".
- If `publication.proofUrl` is missing, show "Publication proof will be available soon."

## Production TODOs

- Replace the simulated payment update with Razorpay or Cashfree verification from a trusted backend.
- Restore strict `adminUsers` role verification before production.
- Move publication proof uploads to Cloudflare R2 signed upload flow.
- Generate real receipt PDFs after payment success.
