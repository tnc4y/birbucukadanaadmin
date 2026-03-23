import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get real-time online users count
 */
export async function getOnlineUsersCount() {
  try {
    const q = query(
      collection(db, 'analytics', 'online_users', 'users'),
      where('isOnline', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('getOnlineUsersCount error:', error);
    return 0;
  }
}

/**
 * Get top viewed teams
 */
export async function getTopViewedTeams(limitCount = 5) {
  try {
    const q = query(
      collection(db, 'analytics', 'team_views', 'teams'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const teams = [];
    snapshot.forEach((doc) => {
      teams.push({
        teamId: doc.id,
        ...doc.data(),
      });
    });
    return teams;
  } catch (error) {
    console.error('getTopViewedTeams error:', error);
    return [];
  }
}

/**
 * Get top viewed announcements
 */
export async function getTopViewedAnnouncements(limitCount = 5) {
  try {
    const q = query(
      collection(db, 'analytics', 'announcement_views', 'announcements'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const announcements = [];
    snapshot.forEach((doc) => {
      announcements.push({
        announcementId: doc.id,
        ...doc.data(),
      });
    });
    return announcements;
  } catch (error) {
    console.error('getTopViewedAnnouncements error:', error);
    return [];
  }
}

/**
 * Get top viewed awards
 */
export async function getTopViewedAwards(limitCount = 5) {
  try {
    const q = query(
      collection(db, 'analytics', 'award_views', 'awards'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const awards = [];
    snapshot.forEach((doc) => {
      awards.push({
        awardId: doc.id,
        ...doc.data(),
      });
    });
    return awards;
  } catch (error) {
    console.error('getTopViewedAwards error:', error);
    return [];
  }
}

/**
 * Get top viewed projects
 */
export async function getTopViewedProjects(limitCount = 5) {
  try {
    const q = query(
      collection(db, 'analytics', 'project_views', 'projects'),
      orderBy('viewCount', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const projects = [];
    snapshot.forEach((doc) => {
      projects.push({
        projectId: doc.id,
        ...doc.data(),
      });
    });
    return projects;
  } catch (error) {
    console.error('getTopViewedProjects error:', error);
    return [];
  }
}

/**
 * Get collection total views
 */
export async function getCollectionTotalViews(collectionType) {
  try {
    const snapshot = await getDocs(
      collection(db, 'analytics', `${collectionType}_views`, collectionType)
    );
    let total = 0;
    snapshot.forEach((doc) => {
      total += doc.data().viewCount || 0;
    });
    return total;
  } catch (error) {
    console.error(`getCollectionTotalViews for ${collectionType} error:`, error);
    return 0;
  }
}

/**
 * Get analytics summary dashboard data
 */
export async function getAnalyticsSummary() {
  try {
    const [
      onlineUsers,
      topTeams,
      topAnnouncements,
      topAwards,
      topProjects,
      teamsTotalViews,
      announcementsTotalViews,
      awardsTotalViews,
      projectsTotalViews,
    ] = await Promise.all([
      getOnlineUsersCount(),
      getTopViewedTeams(5),
      getTopViewedAnnouncements(5),
      getTopViewedAwards(5),
      getTopViewedProjects(5),
      getCollectionTotalViews('team'),
      getCollectionTotalViews('announcement'),
      getCollectionTotalViews('award'),
      getCollectionTotalViews('project'),
    ]);

    return {
      onlineUsers,
      topTeams,
      topAnnouncements,
      topAwards,
      topProjects,
      totalViews: {
        teams: teamsTotalViews,
        announcements: announcementsTotalViews,
        awards: awardsTotalViews,
        projects: projectsTotalViews,
      },
    };
  } catch (error) {
    console.error('getAnalyticsSummary error:', error);
    return null;
  }
}

/**
 * Get real-time users (online right now)
 */
export async function getRealtimeUsers() {
  try {
    const q = query(
      collection(db, 'analytics', 'online_users', 'users'),
      where('isOnline', '==', true)
    );
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        userId: doc.id,
        ...doc.data(),
      });
    });
    return users;
  } catch (error) {
    console.error('getRealtimeUsers error:', error);
    return [];
  }
}

/**
 * Get view history for specific item
 */
export async function getViewHistory(collectionType, itemId) {
  try {
    const docRef = doc(db, 'analytics', `${collectionType}_views`, collectionType, itemId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return [];
    return snapshot.data().viewedBy || [];
  } catch (error) {
    console.error('getViewHistory error:', error);
    return [];
  }
}
