import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button as PaperButton } from "react-native-paper";
import ScreenHeader from "../../../components/ui/ScreenHeader";
import AppCard from "../../../components/ui/AppCard";
import { useAuthStore } from "../../auth/store/auth.store";
import { getFollowUps, FollowUpRecord } from "../services/followUp.service";
import { generateFollowUpsPdf } from "../../../services/pdf/pdf.service";
import { useMasters } from "../../master/hooks/useMasters";
import { scheduleFollowUps } from "../services/followUpNotification.service";

export default function FollowUpScreen() {
  const employee = useAuthStore(s => s.employee);
  const { products } = useMasters();
  const [records,setRecords]=useState<FollowUpRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [generating,setGenerating]=useState(false);

  const load=useCallback(async()=>{
    if(!employee?.id)return;
    setLoading(true);
    try {
      const rows=await getFollowUps(employee.id);
      setRecords(rows);
      await scheduleFollowUps(rows.filter(r => !r.completed && r.followUpDate));
    } catch(e){
      Alert.alert("Error",e instanceof Error?e.message:"Unable to load follow-ups.");
    } finally{setLoading(false);}
  },[employee?.id]);

  useEffect(()=>{void load();},[load]);

  const productMap=useMemo(()=>new Map(products.map((p:any)=>[p.id,p.product_name??""])),[products]);

  async function pdf(){
    if(!employee?.id||generating)return;
    setGenerating(true);
    try {
      await generateFollowUpsPdf({
        employeeName:employee.full_name??"",
        monthLabel:"Follow-Up Records",
        records:records.map(r=>({
          followUpDate:r.followUpDate,visitType:r.visitType,partyName:r.partyName,
          visitDate:r.visitDate,visitTime:r.visitTime,location:r.location,
          discussion:r.discussion,outcome:r.outcome,
          products:r.productIds.map(id=>productMap.get(id)??id)
        }))
      });
    } catch(e){Alert.alert("PDF Error",e instanceof Error?e.message:"Unable to generate PDF.");}
    finally{setGenerating(false);}
  }

  return <View style={styles.screen}>
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} contentContainerStyle={styles.container}>
      <ScreenHeader title="Follow-Up" subtitle="Track upcoming, completed and delayed follow-up meetings"/>
      {loading&&!records.length?<ActivityIndicator/>:null}
      {!loading&&!records.length?<AppCard><Text style={styles.empty}>No follow-up records yet.</Text></AppCard>:null}
      {records.map((r)=><AppCard key={`${r.visitType}-${r.id}`}>
        <View style={styles.top}>
          <View style={styles.typeRow}>
            <Text style={styles.type}>{r.visitType}</Text>
            {r.completed ? <Text style={styles.completed}>✓ Completed</Text> : <Text style={styles.pending}>● Pending</Text>}
          </View>
          <Text style={styles.date}>{r.followUpDate}</Text>
        </View>
        <Text style={styles.party}>{r.partyName}</Text>
        <Text style={styles.meta}>Original visit: {r.visitDate} • {r.visitTime}</Text>
        <Text style={styles.meta}>{r.location}</Text>
        {r.completed ? <Text style={styles.success}>Completed on {r.completedVisitDate}{r.delayDays ? ` • Delayed ${r.delayDays} day${r.delayDays === 1 ? "" : "s"}` : ""}</Text> : null}
        <Text style={styles.label}>Discussion</Text><Text style={styles.value}>{r.discussion||"-"}</Text>
        <Text style={styles.label}>Outcome</Text><Text style={styles.value}>{r.outcome||"-"}</Text>
        <Text style={styles.label}>Products Discussed</Text><Text style={styles.value}>{r.productIds.length?r.productIds.map(id=>productMap.get(id)??id).join(", "):"None"}</Text>
      </AppCard>)}
      <PaperButton mode="outlined" icon="file-pdf-box" onPress={pdf} loading={generating} disabled={generating}>Generate PDF</PaperButton>
    </ScrollView>
  </View>
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:"#F5F7FA"},container:{padding:20,paddingBottom:44,gap:14},
  top:{flexDirection:"row",justifyContent:"space-between"},typeRow:{flexDirection:"row",alignItems:"center",gap:8},
  type:{fontWeight:"800",color:"#0877B9"},date:{fontWeight:"800",color:"#16324F"},party:{fontSize:17,fontWeight:"900",color:"#16324F",marginTop:7},
  meta:{fontSize:12,color:"#7C8A97",marginTop:4},completed:{fontSize:11,fontWeight:"900",color:"#16A34A"},pending:{fontSize:11,fontWeight:"900",color:"#D97706"},
  success:{fontSize:12,fontWeight:"800",color:"#16A34A",marginTop:8},label:{fontSize:10,fontWeight:"800",color:"#7C8A97",marginTop:12,textTransform:"uppercase"},
  value:{fontSize:13,color:"#263746",marginTop:3,lineHeight:19},empty:{textAlign:"center",color:"#8896A3",paddingVertical:12}
});
