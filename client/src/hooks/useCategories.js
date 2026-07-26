/**
 * useCategories — re-exports the shared CategoryContext hook.
 * This preserves backward compatibility: any page importing from this file
 * automatically uses the app-wide shared category state and does NOT create
 * a separate isolated fetch.
 */
export { useCategories as default } from "../contexts/CategoryContext";

