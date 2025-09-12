import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tournament, InsertTournament } from "@repo/schemas";

export function useTournaments() {
  return useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
    queryFn: getQueryFn<Tournament[]>({ on401: "returnNull" }),
  });
}

export function useTournament(id: string) {
  return useQuery<Tournament>({
    queryKey: ["/api/tournaments", id],
    queryFn: getQueryFn<Tournament>({ on401: "returnNull" }),
    enabled: !!id,
  });
}

export function useTournamentStats() {
  return useQuery({
    queryKey: ["/api/tournaments/stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useCreateTournament() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertTournament) => {
      const response = await apiRequest("POST", "/api/tournaments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTournament() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTournament> }) => {
      const response = await apiRequest("PUT", `/api/tournaments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tournament updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTournament() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tournaments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tournament deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    },
  });
}
