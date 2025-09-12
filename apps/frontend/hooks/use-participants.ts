import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Participant, InsertParticipant } from "@repo/schemas";

export function useParticipants(tournamentId?: string) {
  return useQuery<Participant[]>({
    queryKey: ["/api/participants", tournamentId],
    queryFn: () => {
      const url = tournamentId 
        ? `/api/participants?tournamentId=${tournamentId}`
        : "/api/participants";
      return fetch(url).then(res => res.json());
    },
  });
}

export function useParticipant(id: string) {
  return useQuery<Participant>({
    queryKey: ["/api/participants", id],
    queryFn: getQueryFn<Participant>({ on401: "returnNull" }),
    enabled: !!id,
  });
}

export function useCreateParticipant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertParticipant) => {
      const response = await apiRequest("POST", "/api/participants", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Participant registered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register participant",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateParticipant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertParticipant> }) => {
      const response = await apiRequest("PUT", `/api/participants/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Participant updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update participant",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteParticipant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/participants/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Participant removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    },
  });
}
