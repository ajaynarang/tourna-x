'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Badge } from '@repo/ui';
import { 
  Brain, 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  Sparkles,
  Zap,
  Star,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  _id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  entryFee: number;
  tournamentType: string;
  allowedSociety?: string;
  participantCount: number;
  maxParticipants: number;
}

interface AIRecommendation {
  tournament: Tournament;
  score: number;
  reasons: string[];
  matchType: 'perfect' | 'good' | 'fair';
  aiInsights: {
    skillLevel: string;
    scheduleFit: string;
    locationConvenience: string;
    competitionLevel: string;
  };
}

interface AIRecommendationEngineProps {
  tournaments: Tournament[];
  userProfile?: {
    skillLevel?: string;
    preferredSports?: string[];
    location?: string;
    availability?: string[];
  };
}

export default function AIRecommendationEngine({ tournaments, userProfile }: AIRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (tournaments.length > 0) {
      generateRecommendations();
    }
  }, [tournaments, userProfile]);

  const generateRecommendations = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiRecommendations: AIRecommendation[] = tournaments.map(tournament => {
      const score = calculateAIScore(tournament);
      const reasons = generateReasons(tournament, score);
      const matchType: 'perfect' | 'good' | 'fair' = score >= 85 ? 'perfect' : score >= 70 ? 'good' : 'fair';
      
      return {
        tournament,
        score,
        reasons,
        matchType,
        aiInsights: {
          skillLevel: analyzeSkillLevel(tournament),
          scheduleFit: analyzeScheduleFit(tournament),
          locationConvenience: analyzeLocation(tournament),
          competitionLevel: analyzeCompetition(tournament)
        }
      };
    }).sort((a, b) => b.score - a.score);

    setRecommendations(aiRecommendations);
    setIsAnalyzing(false);
  };

  const calculateAIScore = (tournament: Tournament): number => {
    let score = 50; // Base score
    
    // Sport preference (if user has preferences)
    if (userProfile?.preferredSports?.includes(tournament.sport)) {
      score += 20;
    }
    
    // Tournament type and society match
    if (tournament.tournamentType === 'open') {
      score += 15;
    } else if (tournament.tournamentType === 'society_only' && userProfile?.location) {
      score += 10;
    }
    
    // Entry fee analysis (lower fees get higher scores for accessibility)
    if (tournament.entryFee <= 500) {
      score += 15;
    } else if (tournament.entryFee <= 1000) {
      score += 10;
    }
    
    // Participation level (moderate participation is ideal)
    const participationRate = tournament.participantCount / tournament.maxParticipants;
    if (participationRate >= 0.3 && participationRate <= 0.8) {
      score += 15;
    }
    
    // Date analysis (upcoming tournaments get higher scores)
    const daysUntilStart = Math.ceil((new Date(tournament.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart >= 7 && daysUntilStart <= 30) {
      score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  };

  const generateReasons = (tournament: Tournament, score: number): string[] => {
    const reasons: string[] = [];
    
    if (score >= 85) {
      reasons.push('Perfect match for your skill level');
      reasons.push('Convenient schedule and location');
      reasons.push('Optimal competition level');
    } else if (score >= 70) {
      reasons.push('Good fit for your preferences');
      reasons.push('Reasonable entry fee');
      reasons.push('Active participation level');
    } else {
      reasons.push('Decent tournament option');
      reasons.push('Consider your schedule');
    }
    
    return reasons;
  };

  const analyzeSkillLevel = (tournament: Tournament): string => {
    const participationRate = tournament.participantCount / tournament.maxParticipants;
    if (participationRate > 0.8) return 'High competition';
    if (participationRate > 0.5) return 'Moderate competition';
    return 'Beginner friendly';
  };

  const analyzeScheduleFit = (tournament: Tournament): string => {
    const daysUntilStart = Math.ceil((new Date(tournament.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart < 7) return 'Starting soon';
    if (daysUntilStart < 30) return 'Good timing';
    return 'Plenty of time';
  };

  const analyzeLocation = (tournament: Tournament): string => {
    // Mock location analysis
    return 'Convenient location';
  };

  const analyzeCompetition = (tournament: Tournament): string => {
    const participationRate = tournament.participantCount / tournament.maxParticipants;
    if (participationRate > 0.7) return 'High participation';
    if (participationRate > 0.4) return 'Moderate participation';
    return 'Low participation';
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'perfect': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'perfect': return Star;
      case 'good': return CheckCircle;
      case 'fair': return Clock;
      default: return Target;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-purple-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analyzing Tournaments</h3>
          <p className="text-gray-600 mb-4">Finding the perfect matches for you...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">AI Tournament Recommendations</h2>
        <Badge className="bg-purple-100 text-purple-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      {recommendations.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tournaments Available</h3>
            <p className="text-gray-600">Check back later for new tournaments</p>
          </CardContent>
        </Card>
      ) : (
        recommendations.map((rec, index) => {
          const MatchIcon = getMatchTypeIcon(rec.matchType);
          const tournament = rec.tournament;
          
          return (
            <Card key={tournament._id} className={`border-l-4 ${getMatchTypeColor(rec.matchType)} hover:shadow-lg transition-all duration-200`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <Badge className={getMatchTypeColor(rec.matchType)}>
                        <MatchIcon className="h-3 w-3 mr-1" />
                        {rec.matchType.toUpperCase()} MATCH
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      AI Score: <span className="font-semibold text-purple-600">{rec.score}/100</span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{rec.score}</div>
                    <div className="text-xs text-gray-500">AI Score</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Trophy className="h-4 w-4" />
                      <span>{tournament.sport}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>₹{tournament.entryFee}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Skill Level:</span>
                      <span className="ml-2 text-gray-600">{rec.aiInsights.skillLevel}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Schedule:</span>
                      <span className="ml-2 text-gray-600">{rec.aiInsights.scheduleFit}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-600">{rec.aiInsights.locationConvenience}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Competition:</span>
                      <span className="ml-2 text-gray-600">{rec.aiInsights.competitionLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Why this tournament?</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.reasons.map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(showDetails === tournament._id ? null : tournament._id)}
                  >
                    {showDetails === tournament._id ? 'Hide Details' : 'View Details'}
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/tournaments/${tournament._id}`}>
                      <Trophy className="h-4 w-4 mr-1" />
                      Register Now
                    </Link>
                  </Button>
                </div>

                {showDetails === tournament._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Detailed AI Analysis</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Skill Match:</span>
                        <span className="font-medium">{rec.aiInsights.skillLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule Compatibility:</span>
                        <span className="font-medium">{rec.aiInsights.scheduleFit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location Convenience:</span>
                        <span className="font-medium">{rec.aiInsights.locationConvenience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Competition Level:</span>
                        <span className="font-medium">{rec.aiInsights.competitionLevel}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
