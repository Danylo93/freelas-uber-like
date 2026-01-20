export interface MatchingRepository {
    tryAcceptJob(jobId: string, providerId: string): Promise<boolean>; // Returns true if lock acquired
    // Other methods involved in matching state
}
