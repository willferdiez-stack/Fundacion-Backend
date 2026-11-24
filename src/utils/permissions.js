export function canModifyAnomaly(user, anomaly) {
    if (user.role === "admin") {
        return true;
    }

    return user.role === "user" &&
        anomaly.owner.toString() === user.id;
}